from pathlib import Path

from app.services.roadmap_extraction import (
    RoadmapExtractionService
)


# -----------------------------------------
# TXT CREATED BY DOCUMENT PARSER
# -----------------------------------------

txt_file = Path(
    "seed-data/sample_documents/test.txt"
)


if not txt_file.exists():
    raise FileNotFoundError(
        f"TXT file not found: {txt_file}"
    )


# Read extracted text
extracted_text = txt_file.read_text(
    encoding="utf-8"
)


print("Extracted TXT loaded successfully.")
print("--------------------------------------")
print(extracted_text)
print("--------------------------------------")


# -----------------------------------------
# ADMIN ROADMAP EXTRACTION
# -----------------------------------------

print("\nCreating roadmap using Gemini...")


roadmap_service = RoadmapExtractionService()

roadmap = roadmap_service.extract_from_text(
    extracted_text
)


# -----------------------------------------
# SAVE JSON
# -----------------------------------------

output_file = Path(
    "seed-data/roadmap.json"
)

roadmap_service.save_json(
    roadmap,
    output_file
)


print("\nRoadmap extraction successful!")
print(f"JSON saved to: {output_file}")


# Print JSON to terminal
print("\nGenerated Roadmap:")
print(roadmap.model_dump_json(indent=2))