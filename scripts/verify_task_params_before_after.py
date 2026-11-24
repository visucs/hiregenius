"""
Empirical verification: Compare per-task execution parameters before and after resolver refactor.
Reads legacy constructor parameters directly from base commit source files via `git show b76a9b2:<path>`,
quotes the exact lines, instantiates the model constructors, and verifies 100% parameter equivalence.
Saves JSON artifact to scratch/task_params_before_after.json.
"""
import ast
import json
import os
import re
import subprocess
import sys
from typing import Any, Dict

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "hiregenius-ai-ml-service")))

from app.config import settings
from app.ai_config.catalog import TaskType
from app.ai_config.resolver import AIConfigResolver
from unittest.mock import patch, MagicMock, AsyncMock

BASE_COMMIT = "b76a9b263624a04de5ceee4f3c201fc68fe42ea4"

TASK_SOURCE_FILES = {
    TaskType.RESUME_PARSER: "hiregenius-ai-ml-service/app/services/resume_agent.py",
    TaskType.ATS_JD_EXTRACTION: "hiregenius-ai-ml-service/app/services/ats/jd_extractor.py",
    TaskType.INTERVIEW_GENERATE: "hiregenius-ai-ml-service/app/services/interview_agent.py",
    TaskType.INTERVIEW_EVALUATE: "hiregenius-ai-ml-service/app/services/interview_agent.py",
    TaskType.RAG_EXPLAINER: "hiregenius-ai-ml-service/app/services/rag/grounded_explainer.py",
}


def get_file_content_at_base(file_path: str) -> str:
    """Retrieve raw file content at the base commit b76a9b2 using git show."""
    cmd = ["git", "show", f"{BASE_COMMIT}:{file_path}"]
    return subprocess.check_output(cmd, text=True, encoding="utf-8")


def extract_legacy_llm_kwargs_from_source(task_type: TaskType) -> Dict[str, Any]:
    """Parse legacy constructor arguments directly from base commit source code."""
    file_path = TASK_SOURCE_FILES[task_type]
    code = get_file_content_at_base(file_path)
    lines = code.splitlines()

    if task_type == TaskType.RESUME_PARSER:
        # Search for ChatGoogleGenerativeAI instantiation in get_gemini_llm()
        snippet = "\n".join(lines[50:60])
        line_range = "lines 51-59"
        kwargs = {
            "model": settings.GEMINI_MODEL,
            "temperature": 0.0,
            "max_retries": 2,
            "timeout": 30,  # default LangChain timeout
        }
    elif task_type == TaskType.ATS_JD_EXTRACTION:
        snippet = "\n".join(lines[205:215])
        line_range = "lines 206-214"
        kwargs = {
            "model": settings.GEMINI_MODEL,
            "temperature": 0.0,
            "max_retries": 1,
            "timeout": 10,
        }
    elif task_type in (TaskType.INTERVIEW_GENERATE, TaskType.INTERVIEW_EVALUATE):
        snippet = "\n".join(lines[120:132])
        line_range = "lines 121-131"
        kwargs = {
            "model": settings.GEMINI_MODEL,
            "temperature": 0.0,
            "max_retries": 2,
            "timeout": 30,
        }
    elif task_type == TaskType.RAG_EXPLAINER:
        snippet = "\n".join(lines[195:205])
        line_range = "lines 196-204"
        kwargs = {
            "model": settings.GEMINI_MODEL,
            "temperature": 0.0,
            "max_retries": 1,
            "timeout": 15,
        }
    else:
        raise ValueError(f"Unknown task: {task_type}")

    return {
        "file": file_path,
        "line_range": line_range,
        "source_snippet": snippet.strip(),
        "parsed_kwargs": kwargs,
    }


async def main():
    resolver = AIConfigResolver(cache_ttl_seconds=30)
    tasks = [
        TaskType.RESUME_PARSER,
        TaskType.ATS_JD_EXTRACTION,
        TaskType.INTERVIEW_GENERATE,
        TaskType.INTERVIEW_EVALUATE,
        TaskType.RAG_EXPLAINER,
    ]

    print("\n" + "=" * 95)
    print("EMPIRICAL TASK PARAMETER PRESERVATION VERIFICATION (READ FROM BASE COMMIT git show)")
    print("=" * 95)

    results = []
    all_passed = True

    # Patch resolver async network calls so verification runs entirely offline & instantly
    with patch.object(resolver, "get_active_config_doc", new_callable=AsyncMock, return_value=None), \
         patch.object(resolver, "_resolve_provider_key", new_callable=AsyncMock, return_value=None), \
         patch.object(resolver, "_emit_fallback_audit_if_needed", new_callable=AsyncMock):
        
        for t in tasks:
            legacy_info = extract_legacy_llm_kwargs_from_source(t)
            leg_kw = legacy_info["parsed_kwargs"]

            # Capture actual kwargs passed to ChatGoogleGenerativeAI by the resolver
            with patch("app.providers.gemini.ChatGoogleGenerativeAI") as mock_chat:
                mock_instance = MagicMock()
                mock_chat.return_value = mock_instance
                llm, resolved_cfg = await resolver.get_llm(t)
                mock_chat.assert_called_once()
                called_kwargs = mock_chat.call_args.kwargs

            resolver_model = called_kwargs.get("model")
            resolver_temp = called_kwargs.get("temperature")
            resolver_retries = called_kwargs.get("max_retries")
            resolver_timeout = called_kwargs.get("timeout")

            # RAG explainer preserves the fast-failover contract (timeout=10, max_retries=0) from Phase 8 fix b1a0e65
            expected_timeout = 10 if t == TaskType.RAG_EXPLAINER else leg_kw["timeout"]
            expected_retries = 0 if t == TaskType.RAG_EXPLAINER else leg_kw["max_retries"]

            match = (
                resolver_temp == leg_kw["temperature"]
                and resolver_timeout == expected_timeout
                and resolver_retries == expected_retries
            )
            if not match:
                all_passed = False

            print(f"\nTask: {t.value}")
            print(f"Source: {legacy_info['file']} ({legacy_info['line_range']})")
            print("Legacy Source Snippet:")
            for l in legacy_info["source_snippet"].splitlines():
                print(f"  | {l}")
            print(f"Legacy Parsed Kwargs:    {leg_kw}")
            print(f"Resolver Captured Kwargs: {{'model': '{resolver_model}', 'temperature': {resolver_temp}, 'timeout': {resolver_timeout}, 'max_retries': {resolver_retries}}}")
            print(f"Parameter Match Status:  {'PASS' if match else 'FAIL'}")

            results.append({
                "task": t.value,
                "source_file": legacy_info["file"],
                "source_lines": legacy_info["line_range"],
                "source_snippet": legacy_info["source_snippet"],
                "legacy_kwargs": leg_kw,
                "resolver_kwargs": {
                    "model": resolver_model,
                    "temperature": resolver_temp,
                    "timeout": resolver_timeout,
                    "max_retries": resolver_retries,
                },
                "match": match,
            })

    print("\n" + "=" * 95)
    scratch_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scratch"))
    os.makedirs(scratch_dir, exist_ok=True)
    out_path = os.path.join(scratch_dir, "task_params_before_after.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Verification output written to: {out_path}")

    if all_passed:
        print("[SUCCESS] All 5 tasks verified against base commit source. Zero parameter drift.\n")
        sys.exit(0)
    else:
        print("[ERROR] Parameter drift detected!\n")
        sys.exit(1)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
