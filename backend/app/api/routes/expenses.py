"""
backend/app/api/routes/expenses.py — P2

POST /nodes/{node_id}/expenses    upload an expense + its evidencing document
GET  /nodes/{node_id}/expenses    list a node's expenses
"""

from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.document import Document
from app.models.expense import Expense
from app.models.node import Node
from app.models.roadmap_version import RoadmapVersion
from app.models.user import User
from app.schemas.expense import ExpenseRead
from app.services.document_parsing import DocumentParsingService
from app.ai.detection_engine import AnomalyDetectionEngine

router = APIRouter()
parsing_service = DocumentParsingService()
detection_engine = AnomalyDetectionEngine()


@router.post("/{node_id}/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
async def upload_expense(
    node_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseRead:
    node = db.get(Node, node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")

    content_type = request.headers.get("content-type", "")
    
    file_bytes = None
    filename = "document.pdf"
    doc_type = "invoice"

    if "multipart/form-data" in content_type:
        form = await request.form()
        category = str(form.get("category", "materials"))
        amount = Decimal(str(form.get("amount", "0")))
        progress_val_raw = form.get("progress_value")
        progress_value = Decimal(str(progress_val_raw)) if progress_val_raw else None
        progress_unit = form.get("progress_unit")
        progress_unit = str(progress_unit) if progress_unit else None
        doc_type = str(form.get("doc_type", "invoice"))

        file_obj = form.get("file") or form.get("document")
        if file_obj and hasattr(file_obj, "read"):
            file_bytes = await file_obj.read()
            filename = getattr(file_obj, "filename", "document.pdf")
    else:
        body = await request.json()
        category = str(body.get("category", "materials"))
        amount = Decimal(str(body.get("amount", "0")))
        progress_val_raw = body.get("progress_value")
        progress_value = Decimal(str(progress_val_raw)) if progress_val_raw else None
        progress_unit = body.get("progress_unit")
        doc_type = str(body.get("doc_type", "invoice"))

    expense = Expense(
        node_id=node_id,
        category=category,
        amount=amount,
        progress_value=progress_value,
        progress_unit=progress_unit,
        status="uploaded",
    )
    db.add(expense)
    db.flush()

    if file_bytes and len(file_bytes) > 0:
        doc = Document(
            node_id=node_id,
            expense_id=expense.id,
            doc_type=doc_type,
            file_url=f"local-storage/{filename}",
        )
        try:
            extracted_text = parsing_service.extract_text(file_bytes)
            doc.parsed_data = parsing_service.extract_structured_data(
                text=extracted_text,
                schema={"amount": "number", "progress_value": "number", "progress_unit": "string"},
            )
        except Exception:
            doc.parsed_data = {"filename": filename}

        db.add(doc)
        db.flush()

    # Trigger Layer 1 Anomaly Detection
    roadmap = db.scalars(
        select(RoadmapVersion)
        .where(RoadmapVersion.hierarchy_id == node.hierarchy_id)
        .order_by(RoadmapVersion.version_no.desc())
    ).first()

    if roadmap is not None:
        try:
            alert = detection_engine.run_layer1_variance(expense, roadmap)
            if alert is not None:
                db.add(alert)
        except Exception:
            pass

    db.commit()
    db.refresh(expense)
    return ExpenseRead.model_validate(expense)


@router.get("/{node_id}/expenses", response_model=list[ExpenseRead])
def list_expenses(
    node_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ExpenseRead]:
    expenses = db.scalars(
        select(Expense)
        .where(Expense.node_id == node_id)
        .order_by(Expense.uploaded_at.desc())
    ).all()
    return [ExpenseRead.model_validate(e) for e in expenses]
