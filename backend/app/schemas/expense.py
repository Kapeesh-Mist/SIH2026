"""
backend/app/schemas/expense.py — P2
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    category: str
    amount: Decimal
    progress_value: Decimal | None = None
    progress_unit: str | None = None
    # the evidencing document is uploaded as multipart/form-data alongside
    # this JSON in the same request — see api/routes/expenses.py


class ExpenseRead(BaseModel):
    id: UUID
    node_id: UUID
    category: str
    amount: Decimal
    progress_value: Decimal | None
    progress_unit: str | None
    status: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DocumentRead(BaseModel):
    id: UUID
    node_id: UUID
    expense_id: UUID | None
    doc_type: str
    file_url: str
    parsed_data: dict | None
    verified_by: UUID | None
    verified_at: datetime | None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DocumentRejectRequest(BaseModel):
    reason: str
