"""
backend/app/services/document_parsing.py — P3

Implements the DocumentParsingService class stub from models.py / the
class diagram. Shared by roadmap_extraction.py (parsing the plan document)
and api/routes/expenses.py (parsing each expenditure/progress upload).
"""

import io
import json

try:
    import pdfplumber
except ImportError:
    pdfplumber = None  # type: ignore

try:
    import pytesseract
    from PIL import Image
except ImportError:
    pytesseract = None  # type: ignore
    Image = None  # type: ignore

from app.services.llm import call_llm


class DocumentParsingService:
    def extract_text(self, file_bytes: bytes) -> str:
        """Try native PDF text extraction first (fast, exact); fall back to
        OCR for scanned/image-only documents."""
        try:
            text = self._extract_pdf_text(file_bytes)
            if text.strip():
                return text
        except Exception:
            pass
        return self.ocr_scan(file_bytes)

    def _extract_pdf_text(self, file_bytes: bytes) -> str:
        if not pdfplumber:
            # Fallback: simple text decode
            try:
                return file_bytes.decode('utf-8', errors='ignore')
            except Exception:
                return ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)

    def ocr_scan(self, file_bytes: bytes) -> str:
        """OCR fallback for scanned documents/photos of paperwork."""
        if not pytesseract or not Image:
            try:
                return file_bytes.decode('utf-8', errors='ignore')
            except Exception:
                return ""
        try:
            image = Image.open(io.BytesIO(file_bytes))
            return pytesseract.image_to_string(image)
        except Exception:
            return ""

    def extract_structured_data(self, text: str, schema: dict) -> dict:
        """LLM-extract fields defined by `schema` (a simple {field: type}
        map) out of raw document text. Used for both expense documents
        (amount/progress_value/progress_unit) and completion certificates
        (dates, signatories, etc.) — the caller decides the schema."""
        schema_description = "\n".join(f'  "{k}": <{v}>' for k, v in schema.items())
        prompt = (
            f"Extract the following fields from the document text below. "
            f"Return ONLY valid JSON with exactly these keys:\n{{\n{schema_description}\n}}\n\n"
            f"Use null for any field not present in the text — never invent a value.\n\n"
            f"Document text:\n{text}"
        )

        raw = call_llm(prompt, max_tokens=1000)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Return the raw text under a fallback key rather than crashing
            # the upload — the human verifier can still see + correct it.
            return {"_unparsed": raw}
