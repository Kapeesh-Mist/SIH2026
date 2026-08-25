"""
backend/app/services/llm.py

Handles LLM calls with Gemini API as primary and NVIDIA NIM API as fallback.
Uses Python's built-in urllib to avoid external HTTP library dependencies.
"""

import json
import os
import urllib.request
import urllib.error
import logging

from app.config import settings

logger = logging.getLogger(__name__)


def _call_gemini(api_key: str, model: str, prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    with urllib.request.urlopen(req, timeout=30) as response:
        resp_data = json.loads(response.read().decode("utf-8"))
        try:
            return resp_data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            raise ValueError(f"Failed to parse Gemini response structure: {resp_data}") from e


def _call_nvidia(api_key: str, model: str, prompt: str, max_tokens: int) -> str:
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    with urllib.request.urlopen(req, timeout=30) as response:
        resp_data = json.loads(response.read().decode("utf-8"))
        try:
            return resp_data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            raise ValueError(f"Failed to parse NVIDIA response structure: {resp_data}") from e


def call_llm(prompt: str, max_tokens: int = 1000) -> str:
    # 1. Determine Gemini key & model
    gemini_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY") or settings.llm_api_key
    gemini_model = settings.gemini_model or "gemini-1.5-flash"
    
    # 2. Determine NVIDIA key & model
    nvidia_key = settings.nvidia_api_key or os.getenv("NVIDIA_API_KEY")
    nvidia_model = settings.nvidia_model or "meta/llama-3.1-70b-instruct"
    
    # Try Gemini first if key is present
    if gemini_key:
        try:
            logger.info("Attempting LLM call via Gemini API...")
            return _call_gemini(gemini_key, gemini_model, prompt)
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}. Falling back to NVIDIA NIM...")
            # If Gemini fails, we fall back to NVIDIA NIM if key is available
            if nvidia_key:
                try:
                    logger.info("Attempting LLM call via NVIDIA NIM API...")
                    return _call_nvidia(nvidia_key, nvidia_model, prompt, max_tokens)
                except Exception as n_err:
                    logger.error(f"NVIDIA NIM API call failed: {n_err}")
                    raise RuntimeError(f"Both Gemini and NVIDIA API calls failed. Gemini error: {e}. NVIDIA error: {n_err}") from n_err
            else:
                raise RuntimeError(f"Gemini API call failed: {e}. No NVIDIA key provided for fallback.") from e
    
    # If no Gemini key but NVIDIA key is present, use NVIDIA directly
    elif nvidia_key:
        try:
            logger.info("Attempting LLM call via NVIDIA NIM API...")
            return _call_nvidia(nvidia_key, nvidia_model, prompt, max_tokens)
        except Exception as n_err:
            logger.error(f"NVIDIA NIM API call failed: {n_err}")
            raise RuntimeError(f"NVIDIA NIM API call failed: {n_err}") from n_err
            
    else:
        raise ValueError("Neither Gemini API key nor NVIDIA API key is available. Please set them in config, env, or .env.")
