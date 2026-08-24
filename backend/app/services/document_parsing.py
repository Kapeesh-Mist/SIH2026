from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF
from PIL import Image
import pytesseract


class DocumentParsingError(Exception):
    """Raised when a document cannot be parsed."""
    pass


class DocumentParsingService:
    """
    Extracts text from uploaded documents.

    Supported formats:
    - PDF
    - PNG
    - JPG / JPEG
    - TXT

    The service returns plain text so that the roadmap extraction
    service can process it independently.
    """

    SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".txt"}

    def parse(self, file_path: str) -> str:
        path = Path(file_path)

        if not path.exists():
            raise DocumentParsingError(
                f"Document does not exist: {file_path}"
            )

        extension = path.suffix.lower()

        if extension not in self.SUPPORTED_EXTENSIONS:
            raise DocumentParsingError(
                f"Unsupported document type: {extension}"
            )

        try:
            if extension == ".pdf":
                return self._parse_pdf(path)

            if extension in {".png", ".jpg", ".jpeg"}:
                return self._parse_image(path)

            if extension == ".txt":
                return path.read_text(encoding="utf-8")

        except Exception as exc:
            raise DocumentParsingError(
                f"Failed to parse document: {path.name}"
            ) from exc

        return ""

    def _parse_pdf(self, path: Path) -> str:
        """
        Extract embedded text from a PDF.

        If the PDF contains little/no text, render the pages
        and use OCR as a fallback.
        """

        document = fitz.open(path)

        extracted_pages = []

        for page in document:
            text = page.get_text("text").strip()

            if text:
                extracted_pages.append(text)
            else:
                ocr_text = self._ocr_pdf_page(page)
                if ocr_text:
                    extracted_pages.append(ocr_text)

        document.close()

        return "\n\n".join(extracted_pages).strip()

    def _ocr_pdf_page(self, page) -> str:
        """
        Render a PDF page as an image and run Tesseract OCR.
        """

        pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2))

        image = Image.frombytes(
            "RGB",
            [pixmap.width, pixmap.height],
            pixmap.samples,
        )

        return pytesseract.image_to_string(image).strip()

    def _parse_image(self, path: Path) -> str:
        """
        Extract text from an image using Tesseract OCR.
        """

        image = Image.open(path)

        return pytesseract.image_to_string(image).strip()