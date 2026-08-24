from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class HierarchyBase(BaseModel):
    name: str
    description: Optional[str] = None
    initial_budget: Optional[float] = None

class HierarchyCreate(HierarchyBase):
    owner_id: str

class HierarchyResponse(HierarchyBase):
    id: str
    status: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
