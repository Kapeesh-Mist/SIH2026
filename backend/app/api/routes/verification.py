"""
backend/app/api/routes/verification.py — P2

POST /documents/{id}/verify    upper node confirms a lower node's upload
POST /documents/{id}/reject    upper node rejects it, with a reason
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.document import Document
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import DocumentRead, DocumentRejectRequest

router = APIRouter()


@router.post("/{document_id}/verify", response_model=DocumentRead)
def verify_document(
    document_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> DocumentRead:
    doc = db.get(Document, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.verified_by = current_user.id
    doc.verified_at = datetime.now(timezone.utc)

    if doc.expense_id:
        expense = db.get(Expense, doc.expense_id)
        if expense is not None:
            expense.status = "verified"

    db.commit()
    db.refresh(doc)
    return DocumentRead.model_validate(doc)


@router.post("/{document_id}/reject", response_model=DocumentRead)
def reject_document(
    document_id: UUID,
    payload: DocumentRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentRead:
    doc = db.get(Document, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.verified_by = current_user.id
    doc.verified_at = datetime.now(timezone.utc)
    # parsed_data keeps the AI extraction; reason is recorded via an Alert
    # (layer='verification', severity='warning') so it shows in the same
    # alerts feed rather than a separate rejection log
    if doc.expense_id:
        expense = db.get(Expense, doc.expense_id)
        if expense is not None:
            expense.status = "rejected"

    db.commit()
    db.refresh(doc)
    return DocumentRead.model_validate(doc)
