from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ExpenseBase(BaseModel):
    node_id: str
    amount: float
    description: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True
