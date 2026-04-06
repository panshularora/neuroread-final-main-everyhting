from __future__ import annotations

import json
import os

from dotenv import load_dotenv
from app.services.llm_client import get_groq_client

load_dotenv()

def _client():
    return get_groq_client()


def run_tutor(text: str, question: str, mode: str):
    """
    Use the Groq LLM to act as a reading tutor for the given text.
    """
    mode_instruction = {
        "explain": "Explain the answer step by step, using clear and accessible language.",
        "summarize": "Summarize the key ideas that answer the question.",
        "example": "Answer the question and provide concrete, age‑appropriate examples.",
    }.get(mode, "Explain the answer clearly.")

    system_prompt = """
You are an expert AI reading tutor helping a neurodiverse learner understand a complex text.
Your goal is to provide a clear, supportive, and accessible answer to the user's question.

RULES:
1. Return ONLY a valid JSON object.
2. The JSON MUST contain these keys: "answer", "suggested_questions", and "confidence_score".
3. Use simple, direct language. Avoid jargon.
4. If the question cannot be answered from the text, explain why and suggest what to look for.

JSON Format:
{
  "answer": "Your detailed explanation here...",
  "suggested_questions": ["Follow-up question 1?", "Follow-up question 2?"],
  "confidence_score": 0.95
}
"""

    user_prompt = f"""
I am reading this text:
---
{text}
---

My question is: "{question}"
Mode: {mode} (Instruction: {mode_instruction})

Please provide a helpful response in the required JSON format.
"""

    models = ["llama-3.1-8b-instant", "llama3-8b-8192", "mixtral-8x7b-32768"]
    last_error = None
    data = {}

    import re
    for model_name in models:
        try:
            response = _client().chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content or ""
            
            # Robust extraction
            try:
                cleaned = content.strip()
                if "```json" in cleaned:
                    cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0].strip()
                elif "```" in cleaned:
                    cleaned = cleaned.split("```", 1)[1].split("```", 1)[0].strip()
                data = json.loads(cleaned)
            except (json.JSONDecodeError, IndexError):
                # Regex fallback: find first { and last }
                match = re.search(r"(\{.*\})", content, re.DOTALL)
                if match:
                    try:
                        data = json.loads(match.group(1))
                    except json.JSONDecodeError:
                        data = {}
                else:
                    data = {}

            # Validate and back-fill required keys
            if not isinstance(data, dict):
                data = {}
            
            if "answer" not in data or not str(data.get("answer", "")).strip():
                data["answer"] = "I processed the information but encountered a formatting error when preparing the explanation. Please try rephrasing your question."
            
            if "suggested_questions" not in data or not isinstance(data["suggested_questions"], list):
                data["suggested_questions"] = [
                    "Can you explain this in simpler terms?",
                    "What is the main idea here?",
                    "Are there any tricky words to learn?"
                ]
            
            if "confidence_score" not in data:
                data["confidence_score"] = 0.7

            break # Success, exit loop
        except Exception as e:
            last_error = e
            emsg = str(e).lower()
            # If it's a 401, 403, or account error, no point in retrying other models
            if any(code in emsg for code in ["401", "invalid_api_key", "restricted"]):
                data = {"answer": "Invalid Groq API key or account restricted. Please check your billing or usage limits in the Groq console.", "confidence_score": 0.0}
                break
            # Continue to next model for 503, 429, or other transient errors
            continue

    if not data:
        emsg = str(last_error).lower() if last_error else "unknown error"
        if "429" in emsg or "rate_limit" in emsg:
            data = {"answer": "Groq API rate limit reached. Please wait a moment before trying again.", "confidence_score": 0.0}
        elif "503" in emsg or "unavailable" in emsg:
            data = {"answer": "The AI model is currently unavailable on Groq. Please try again later.", "confidence_score": 0.0}
        else:
            data = {"answer": f"I'm sorry, I encountered an error while trying to help: {str(last_error)}", "confidence_score": 0.0}

    answer = data.get("answer")
    if not answer or not str(answer).strip():
        answer = "I was unable to generate a detailed answer. This might be due to a technical issue or the question being outside the scope of the text. Please try rephrasing your question."
    
    suggested_questions = data.get("suggested_questions") or [
        "Can you explain that in a different way?",
        "What are the most important parts of this text?",
        "Are there any tricky words here?"
    ]
    if not isinstance(suggested_questions, list):
        suggested_questions = [str(suggested_questions)]

    confidence_val = data.get("confidence_score")
    if confidence_val is None:
        confidence_score = 0.6
    else:
        try:
            confidence_score = float(confidence_val)
        except (ValueError, TypeError):
            confidence_score = 0.6

    return answer, [str(q).strip() for q in suggested_questions if str(q).strip()], float(
        max(0.0, min(1.0, confidence_score))
    )

