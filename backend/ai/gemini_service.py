"""
Sherlock AI service layer, powered by OpenRouter (nvidia/nemotron-3-ultra-550b-a55b:free).

Design note on Smart Scan:
For the image-based Smart Scan feature, this module asks the model to describe
*visible attributes* of an uploaded photo (clothing, approximate age range,
visible objects, setting, text/plate numbers if readable, etc.) and then the
app does a plain text/keyword search against your local database using those
attributes. This deliberately does NOT do biometric facial-recognition
identity matching (i.e. it never claims "this is person X" from a face).
That kind of biometric identification is a much higher-stakes capability
with serious accuracy and civil-liberties concerns, so Smart Scan is built
as an AI-assisted *search helper*, not an identity-matching system. If your
project later needs real biometric matching, that should go through a
purpose-built, legally-reviewed system — not a general LLM.
"""
import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_INSTRUCTION = (
    "You are Sherlock AI, an assistant embedded in a police case-management "
    "system (SherlockBot / Police OS) used by officers. You help officers "
    "search records, summarize cases, and reason over the data given to you "
    "as context. Rules you always follow:\n"
    "1. Only use facts given to you in the provided context or the officer's "
    "message. Never invent case details, names, addresses, or charges.\n"
    "2. If the context does not contain an answer, say so plainly and "
    "suggest what the officer could search for instead.\n"
    "3. Never claim to positively identify a specific real person from an "
    "image or description — only describe visible attributes and suggest "
    "the officer verify identity through proper procedure.\n"
    "4. Keep responses concise, factual, and professional."
)


def _get_api_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key or api_key == "your_openrouter_api_key_here":
        raise RuntimeError(
            "OPENROUTER_API_KEY is not set. Add it to your .env file. "
            "Get a key at https://openrouter.ai/keys"
        )
    return api_key


def _call_openrouter(messages: list, max_tokens: int = 600, temperature: float = 0.3) -> str:
    api_key = _get_api_key()

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return (data["choices"][0]["message"]["content"] or "").strip()
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"OpenRouter request failed: {e}")
    except (KeyError, IndexError):
        raise RuntimeError("OpenRouter returned an unexpected response format.")


def chat_reply(message: str, context: str = "") -> str:
    prompt = message
    if context:
        prompt = f"Relevant database context:\n{context}\n\nOfficer's question:\n{message}"

    messages = [
        {"role": "system", "content": SYSTEM_INSTRUCTION},
        {"role": "user", "content": prompt},
    ]

    result = _call_openrouter(messages, max_tokens=600, temperature=0.3)
    return result or "I couldn't generate a response. Please try rephrasing."


def analyze_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """Returns a plain-text description of visible attributes in the image."""
    instruction = (
        "Describe only the visible, objective attributes in this image that "
        "could help an officer search records: approximate age range, "
        "clothing description, visible accessories, any readable text or "
        "plate numbers, setting/location clues, and distinguishing marks if "
        "visible. Do not guess or state anyone's name or identity. Keep it "
        "to 4-6 short bullet points."
    )

    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    messages = [
        {"role": "system", "content": SYSTEM_INSTRUCTION},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": instruction},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime_type};base64,{b64_image}"},
                },
            ],
        },
    ]

    try:
        result = _call_openrouter(messages, max_tokens=400, temperature=0.2)
        return result or "Could not analyze the image."
    except RuntimeError as e:
        return (
            "Image analysis is unavailable — the configured model may not "
            f"support image input. ({e})"
        )


def summarize_matches(query: str, context: str) -> str:
    prompt = (
        f"An officer searched Smart Scan with this query:\n\"{query}\"\n\n"
        f"Here are the matching records found in the local database:\n{context}\n\n"
        "Write a short 2-4 sentence summary for the officer highlighting the "
        "most relevant matches and any patterns worth noting. If there are "
        "no matches, say so and suggest a broader search term."
    )

    messages = [
        {"role": "system", "content": SYSTEM_INSTRUCTION},
        {"role": "user", "content": prompt},
    ]

    return _call_openrouter(messages, max_tokens=300, temperature=0.3)