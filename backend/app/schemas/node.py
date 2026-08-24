from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NodeBase(BaseModel):
    hierarchy_id: str
    parent_id: Optional[str] = None
    role: Optional[str] = None
    allocated_budget: Optional[float] = None

class NodeCreate(NodeBase):
    user_id: str

class NodeResponse(NodeBase):
    id: str
    status: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
