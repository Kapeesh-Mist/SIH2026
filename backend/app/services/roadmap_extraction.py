"""
backend/app/services/roadmap_extraction.py — P3

Turns an uploaded scheme/plan document into the structured roadmap JSON
used by RoadmapVersion.extracted_json. Always followed by a human review
step (api/routes/hierarchies.py: submit_roadmap_review) before the result
is trusted by any detection layer — this function only ever produces a
*draft*.
"""

import json

from app.services.document_parsing import DocumentParsingService
from app.services.llm import call_llm

_parsing_service = DocumentParsingService()

ROADMAP_SCHEMA_INSTRUCTIONS = """
Return ONLY valid JSON matching this shape, nothing else:

{
  "categories": {
    "<category_name>": {
      "amount": <expected total budget for this category, number>,
      "expected_progress": <expected progress quantity, number>,
      "progress_unit": "<e.g. percent, km, units, beds>",
      "expected_range": [<min allocation for a node in this category>, <max allocation>],
      "timeline_days": <expected days to complete, number or null>
    }
  }
}

Ground every field in the document text. If a value isn't stated or
reasonably inferable, use null rather than guessing a plausible-looking
number.
"""


def extract_roadmap(plan_document_bytes: bytes) -> dict:
    """OCR/text-extract the plan document, then LLM-extract into the fixed
    roadmap schema above. Raises ValueError if the model doesn't return
    parseable JSON, so the caller can surface a clear error instead of
    silently saving garbage as the baseline."""
    text = _parsing_service.extract_text(plan_document_bytes)

    raw = call_llm(f"{ROADMAP_SCHEMA_INSTRUCTIONS}\n\nDocument text:\n{text}", max_tokens=2000)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Roadmap extraction did not return valid JSON: {exc}\nRaw response: {raw}") from exc
