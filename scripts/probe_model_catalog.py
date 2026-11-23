"""
Committed script to probe Google Gemini models via API and record empirical catalog evidence.
Calls list_models() and executes real structured-output calls with tiny schema to measure latency.
Outputs results to gitignored scratch/raw_catalog_probe.json.
"""
import os
import sys
import time
import json
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "hiregenius-ai-ml-service")))

from app.config import settings
from pydantic import BaseModel, Field

try:
    import google.generativeai as genai
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:
    print("Dependencies not found. Run within hiregenius-ai-ml-service/venv.")
    sys.exit(1)


class TinyProbeSchema(BaseModel):
    ping: str = Field(description="Must return 'pong'")


CANDIDATE_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]


def probe_model(model_name: str, api_key: str) -> Dict[str, Any]:
    print(f"Probing {model_name}...")
    start_t = time.time()
    try:
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.0,
            max_retries=0,
            timeout=15,
        )
        structured_llm = llm.with_structured_output(TinyProbeSchema)
        res = structured_llm.invoke("Respond with ping pong")
        latency_ms = int((time.time() - start_t) * 1000)
        return {
            "model_id": model_name,
            "status": "VERIFIED",
            "latency_ms": latency_ms,
            "error": None,
            "selectable": True,
        }
    except Exception as e:
        latency_ms = int((time.time() - start_t) * 1000)
        err_msg = str(e)
        if "404" in err_msg or "not found" in err_msg.lower():
            status = "UNAVAILABLE"
            selectable = False
        elif "429" in err_msg or "quota" in err_msg.lower() or "resource_exhausted" in err_msg.lower():
            status = "UNVERIFIED"
            selectable = False
        else:
            status = "UNAVAILABLE"
            selectable = False
        return {
            "model_id": model_name,
            "status": status,
            "latency_ms": latency_ms,
            "error": err_msg[:120],
            "selectable": selectable,
        }


def main():
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        print("[ERROR] GEMINI_API_KEY is not configured in environment.")
        sys.exit(1)

    results = []
    print("\n" + "=" * 80)
    print(f"{'MODEL ID':<20} | {'STATUS':<12} | {'LATENCY (ms)':<14} | SELECTABLE | ERROR")
    print("=" * 80)
    for m in CANDIDATE_MODELS:
        res = probe_model(m, api_key)
        results.append(res)
        err_snippet = res["error"] or "None"
        print(f"{res['model_id']:<20} | {res['status']:<12} | {res['latency_ms']:<14} | {str(res['selectable']):<10} | {err_snippet}")
        time.sleep(1)  # avoid burst 429
    print("=" * 80)

    scratch_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "hiregenius-ai-ml-service", "scratch"))
    os.makedirs(scratch_dir, exist_ok=True)
    out_path = os.path.join(scratch_dir, "raw_catalog_probe.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nCatalog probe written to: {out_path}\n")


if __name__ == "__main__":
    main()
