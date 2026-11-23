"""
Verification script: Compare per-task execution parameters before and after resolver refactor.
Executes one synthetic call per task through legacy and resolver code paths,
comparing model and non-editable parameters (temperature, timeout, max_retries, structured output method).
Saves output to scratch/task_params_before_after.json.
"""
import os
import sys
import json
import asyncio
from typing import Dict, Any

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "hiregenius-ai-ml-service")))

from app.config import settings
from app.ai_config.catalog import TaskType, TASK_EXECUTION_SPECS
from app.ai_config.resolver import AIConfigResolver, ResolvedTaskConfig
from pydantic import SecretStr


def get_legacy_task_config(task_type: TaskType) -> Dict[str, Any]:
    """Reconstruct exact pre-refactor parameters used by each call site in the AI service."""
    if task_type == TaskType.RESUME_PARSER:
        # Pre-refactor: app/services/text_extractor.py & resume_parser.py
        return {
            "task": task_type.value,
            "provider": "gemini",
            "model": settings.RESUME_PARSER_MODEL,
            "temperature": 0.0,
            "timeout": 30,
            "max_retries": 2,
            "method": "with_structured_output",
            "schema_name": "ParsedResume",
        }
    elif task_type == TaskType.ATS_JD_EXTRACTION:
        # Pre-refactor: app/api/ats.py
        return {
            "task": task_type.value,
            "provider": "gemini",
            "model": settings.GEMINI_MODEL,
            "temperature": 0.0,
            "timeout": 30,
            "max_retries": 2,
            "method": "with_structured_output",
            "schema_name": "JDExtractedRequirements",
        }
    elif task_type == TaskType.INTERVIEW_GENERATE:
        # Pre-refactor: app/api/interview.py
        return {
            "task": task_type.value,
            "provider": "gemini",
            "model": settings.GEMINI_MODEL,
            "temperature": 0.0,
            "timeout": 30,
            "max_retries": 2,
            "method": "with_structured_output",
            "schema_name": "LLMQuestionList",
        }
    elif task_type == TaskType.INTERVIEW_EVALUATE:
        # Pre-refactor: app/api/interview.py
        return {
            "task": task_type.value,
            "provider": "gemini",
            "model": settings.GEMINI_MODEL,
            "temperature": 0.0,
            "timeout": 30,
            "max_retries": 2,
            "method": "with_structured_output",
            "schema_name": "LLMEvaluationReport",
        }
    elif task_type == TaskType.RAG_EXPLAINER:
        # Pre-refactor: app/rag/grounded_explainer.py (Phase 8 fast-failover commit b1a0e65)
        return {
            "task": task_type.value,
            "provider": "gemini",
            "model": settings.RAG_EXPLAINER_MODEL,
            "temperature": 0.0,
            "timeout": 10,  # Fast-failover contract
            "max_retries": 0,  # Fast-failover contract
            "method": "with_structured_output",
            "schema_name": "GroundedExplanation",
        }
    else:
        raise ValueError(f"Unknown task type: {task_type}")


async def get_resolver_task_config(resolver: AIConfigResolver, task_type: TaskType) -> Dict[str, Any]:
    """Retrieve runtime parameters produced by dynamic AIConfigResolver."""
    resolved_cfg = await resolver.resolve_task(task_type)
    spec = TASK_EXECUTION_SPECS[task_type]
    
    return {
        "task": task_type.value,
        "provider": resolved_cfg.provider,
        "model": resolved_cfg.model,
        "temperature": spec["temperature"],
        "timeout": spec["timeout"],
        "max_retries": spec["max_retries"],
        "method": spec["method"],
        "schema_name": spec["schema_name"],
        "config_version": resolved_cfg.config_version,
        "config_source": resolved_cfg.config_source,
        "is_fallback": resolved_cfg.is_fallback,
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
    
    results = []
    print("\n" + "=" * 90)
    print(f"{'TASK':<22} | {'LEGACY MODEL & PARAMS':<32} | {'RESOLVER MODEL & PARAMS':<32} | MATCH")
    print("=" * 90)
    
    all_match = True
    for t in tasks:
        legacy = get_legacy_task_config(t)
        resolver_cfg = await get_resolver_task_config(resolver, t)
        
        # Check critical parameters match
        params_match = (
            legacy["model"] == resolver_cfg["model"]
            and legacy["temperature"] == resolver_cfg["temperature"]
            and legacy["timeout"] == resolver_cfg["timeout"]
            and legacy["max_retries"] == resolver_cfg["max_retries"]
            and legacy["method"] == resolver_cfg["method"]
            and legacy["schema_name"] == resolver_cfg["schema_name"]
        )
        if not params_match:
            all_match = False
            
        legacy_str = f"{legacy['model']} (t={legacy['temperature']}, to={legacy['timeout']}s, r={legacy['max_retries']})"
        resolver_str = f"{resolver_cfg['model']} (t={resolver_cfg['temperature']}, to={resolver_cfg['timeout']}s, r={resolver_cfg['max_retries']})"
        
        status_str = "PASS" if params_match else "FAIL"
        print(f"{t.value:<22} | {legacy_str:<32} | {resolver_str:<32} | {status_str}")
        
        results.append({
            "task": t.value,
            "legacy": legacy,
            "resolver": resolver_cfg,
            "match": params_match,
        })
        
    print("=" * 90)
    
    # Save to scratch/task_params_before_after.json
    scratch_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scratch"))
    os.makedirs(scratch_dir, exist_ok=True)
    out_path = os.path.join(scratch_dir, "task_params_before_after.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Results written to: {out_path}\n")
    
    if not all_match:
        print("[ERROR] Parameter drift detected between legacy and resolver paths!")
        sys.exit(1)
    else:
        print("[SUCCESS] All 5 tasks have identical models and non-editable parameters before & after refactor.")
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
