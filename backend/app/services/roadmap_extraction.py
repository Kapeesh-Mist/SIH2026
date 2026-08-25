import json
import os
import re
from pathlib import Path
from typing import List, Optional, Union

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field, field_validator


# Load .env from SIH2026 root or parent directories recursively
def load_environment():
    current_dir = Path(__file__).resolve().parent
    for parent in [current_dir] + list(current_dir.parents):
        env_path = parent / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            return
    load_dotenv()

load_environment()


# --------------------------------------------------
# ROADMAP VALIDATION HELPERS
# --------------------------------------------------

def clean_numeric_string(v) -> Optional[float]:
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        # Remove commas, currency symbols like INR, %, and whitespace
        cleaned = re.sub(r'[^\d.-]', '', v)
        if not cleaned:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def clean_int_string(v) -> Optional[int]:
    val = clean_numeric_string(v)
    return int(val) if val is not None else None


# --------------------------------------------------
# ROADMAP JSON STRUCTURE
# --------------------------------------------------

class RoadmapCategory(BaseModel):
    name: str
    expected_amount: Optional[float] = None
    expected_progress: Optional[float] = None
    progress_unit: Optional[str] = None

    @field_validator("expected_amount", "expected_progress", mode="before")
    @classmethod
    def validate_floats(cls, v):
        return clean_numeric_string(v)


class Roadmap(BaseModel):
    scheme_name: Optional[str] = None
    total_budget: Optional[float] = None
    duration_months: Optional[int] = None
    start_date: Optional[str] = None
    expected_completion_date: Optional[str] = None

    categories: List[RoadmapCategory] = Field(
        default_factory=list
    )

    @field_validator("total_budget", mode="before")
    @classmethod
    def validate_total_budget(cls, v):
        return clean_numeric_string(v)

    @field_validator("duration_months", mode="before")
    @classmethod
    def validate_duration_months(cls, v):
        return clean_int_string(v)


# --------------------------------------------------
# ROADMAP EXTRACTION SERVICE
# --------------------------------------------------

class RoadmapExtractionService:

    def __init__(self):
        #print("GEMINI MODEL BEING USED:", self.model)

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is missing from .env"
            )

        model_name = os.getenv(
            "GEMINI_MODEL",
            "gemini-3.6-flash"
        )

        # Override legacy model to prevent 404 client errors
        if model_name == "gemini-2.5-flash":
            model_name = "gemini-3.6-flash"

        self.model = model_name

        self.client = genai.Client(
            api_key=api_key
        )

    def extract_from_text(self, extracted_text: str) -> Roadmap:

        if not extracted_text.strip():
            raise ValueError(
                "Extracted document text is empty."
            )

        prompt = f"""
You are extracting the ORIGINAL PLAN of a government
development scheme.

The text below was already extracted from a document
using a document parsing/OCR service.

Your job is ONLY to convert the information explicitly
present in the document into a structured roadmap.

IMPORTANT RULES:

1. Do not invent information.
2. Do not guess missing values.
3. If information is missing, return null.
4. Do not detect fraud.
5. Do not detect anomalies.
6. Do not analyze actual expenditure.
7. Do not create information that is not present.
8. Extract planned/baseline information only.

Extract:

- scheme name
- total sanctioned budget
- planned duration
- start date
- expected completion date
- project/work categories
- expected amount for each category
- expected progress
- progress unit

DOCUMENT TEXT:
-------------------------
{extracted_text}
-------------------------
"""

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": Roadmap,
            },
        )

        try:
            if response.parsed:
                return response.parsed
        except Exception:
            pass

        if response.text:
            cleaned_text = response.text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()

            try:
                data = json.loads(cleaned_text)
                return Roadmap.model_validate(data)
            except Exception as e:
                raise ValueError(
                    f"Failed to parse Gemini response as Roadmap schema: {e}. Raw response: {response.text}"
                )

        raise ValueError(
            "Gemini did not return a valid roadmap."
        )

    def save_json(
        self,
        roadmap: Roadmap,
        output_path: Union[str, Path]
    ):

        output_file = Path(output_path)

        output_file.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        with open(
            output_file,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                roadmap.model_dump(),
                file,
                indent=2,
                ensure_ascii=False
            )