"""
backend/app/schemas/hierarchy.py — P1
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class HierarchyCreate(BaseModel):
    name: str
    description: str | None = None
    initial_budget: Decimal = Field(gt=0)
    # plan document itself is sent as multipart/form-data alongside this JSON,
    # not part of the schema — see api/routes/hierarchies.py


class HierarchyRead(BaseModel):
    id: UUID
    name: str
    description: str | None
    initial_budget: Decimal
    owner_id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class RoadmapVersionRead(BaseModel):
    id: UUID
    hierarchy_id: UUID
    version_no: int
    extracted_json: dict
    approved_by: UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


class RoadmapReviewSubmit(BaseModel):
    """What the admin submits after editing the AI-drafted roadmap
    (pages/RoadmapReview.tsx) — becomes the next roadmap_versions row."""
    edited_json: dict
