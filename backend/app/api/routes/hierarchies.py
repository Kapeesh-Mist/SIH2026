"""
backend/app/api/routes/hierarchies.py — P1

POST /hierarchies                         create scheme + kick off plan extraction
GET  /hierarchies?status=ongoing          list + filter
GET  /hierarchies/{id}                    single scheme
GET  /hierarchies/{id}/roadmap            latest roadmap version
GET  /hierarchies/{id}/roadmap/latest     latest roadmap version alias
POST /hierarchies/{id}/roadmap/review     save human-edited roadmap as a new version
"""

from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.hierarchy import Hierarchy
from app.models.node import Node
from app.models.roadmap_version import RoadmapVersion
from app.models.user import User
from app.schemas.hierarchy import HierarchyRead, RoadmapReviewSubmit, RoadmapVersionRead
from app.services.roadmap_extraction import extract_roadmap

router = APIRouter()


@router.post("", response_model=HierarchyRead, status_code=status.HTTP_201_CREATED)
async def create_hierarchy(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HierarchyRead:
    name = ""
    description = None
    initial_budget = Decimal("0.00")
    file_bytes = None

    try:
        # Try parsing as JSON first
        body = await request.json()
        name = str(body.get("name", ""))
        description = body.get("description")
        initial_budget = Decimal(str(body.get("initial_budget", 0)))
    except Exception:
        # Fallback to form data (multipart or urlencoded)
        try:
            form = await request.form()
            name = str(form.get("name", ""))
            description = form.get("description")
            description = str(description) if description else None
            initial_budget_str = form.get("initial_budget", "0")
            initial_budget = Decimal(str(initial_budget_str))
            file_obj = form.get("plan_document") or form.get("file")
            if file_obj and hasattr(file_obj, "read"):
                file_bytes = await file_obj.read()
        except Exception:
            pass

    if not name:
        raise HTTPException(status_code=422, detail="Scheme name is required")

    hierarchy = Hierarchy(
        name=name,
        description=description,
        initial_budget=initial_budget,
        owner_id=current_user.id,
        status="active",
    )
    db.add(hierarchy)
    db.flush()

    # Create root node for the scheme
    root_node = Node(
        hierarchy_id=hierarchy.id,
        parent_id=None,
        path=str(hierarchy.id).replace("-", "_"),
        user_id=current_user.id,
        role="Apex Project Office",
        allocated_budget=initial_budget,
        status="active",
    )
    db.add(root_node)

    # If plan document provided, extract roadmap via LLM; else create default baseline
    if file_bytes and len(file_bytes) > 0:
        try:
            extracted_json = extract_roadmap(file_bytes)
        except Exception:
            extracted_json = {
                "categories": {
                    "materials": {"amount": float(initial_budget * Decimal("0.5")), "expected_progress": 100, "progress_unit": "units"},
                    "labour": {"amount": float(initial_budget * Decimal("0.3")), "expected_progress": 50, "progress_unit": "person-days"},
                    "operations": {"amount": float(initial_budget * Decimal("0.2")), "expected_progress": 12, "progress_unit": "months"},
                }
            }
    else:
        extracted_json = {
            "categories": {
                "materials": {"amount": float(initial_budget * Decimal("0.5")), "expected_progress": 100, "progress_unit": "units"},
                "labour": {"amount": float(initial_budget * Decimal("0.3")), "expected_progress": 50, "progress_unit": "person-days"},
                "operations": {"amount": float(initial_budget * Decimal("0.2")), "expected_progress": 12, "progress_unit": "months"},
            }
        }

    roadmap = RoadmapVersion(
        hierarchy_id=hierarchy.id,
        version_no=1,
        extracted_json=extracted_json,
        approved_by=current_user.id,
    )
    db.add(roadmap)

    db.commit()
    db.refresh(hierarchy)
    return HierarchyRead.model_validate(hierarchy)


@router.get("", response_model=list[HierarchyRead])
def list_hierarchies(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[HierarchyRead]:
    stmt = select(Hierarchy)
    if status_filter:
        stmt = stmt.where(Hierarchy.status == status_filter)
    hierarchies = db.scalars(stmt).all()
    return [HierarchyRead.model_validate(h) for h in hierarchies]


@router.get("/{hierarchy_id}", response_model=HierarchyRead)
def get_hierarchy(
    hierarchy_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> HierarchyRead:
    hierarchy = db.get(Hierarchy, hierarchy_id)
    if hierarchy is None:
        raise HTTPException(status_code=404, detail="Hierarchy not found")
    return HierarchyRead.model_validate(hierarchy)


@router.get("/{hierarchy_id}/roadmap", response_model=RoadmapVersionRead)
@router.get("/{hierarchy_id}/roadmap/latest", response_model=RoadmapVersionRead)
def get_latest_roadmap(
    hierarchy_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> RoadmapVersionRead:
    stmt = (
        select(RoadmapVersion)
        .where(RoadmapVersion.hierarchy_id == hierarchy_id)
        .order_by(RoadmapVersion.version_no.desc())
    )
    roadmap = db.scalars(stmt).first()
    if roadmap is None:
        hierarchy = db.get(Hierarchy, hierarchy_id)
        if not hierarchy:
            raise HTTPException(status_code=404, detail="Hierarchy not found")
        roadmap = RoadmapVersion(
            hierarchy_id=hierarchy_id,
            version_no=1,
            extracted_json={
                "categories": {
                    "materials": {"amount": float(hierarchy.initial_budget * Decimal("0.5")), "expected_progress": 100, "progress_unit": "units"},
                    "labour": {"amount": float(hierarchy.initial_budget * Decimal("0.3")), "expected_progress": 50, "progress_unit": "person-days"},
                    "operations": {"amount": float(hierarchy.initial_budget * Decimal("0.2")), "expected_progress": 12, "progress_unit": "months"},
                }
            },
            approved_by=current_user.id,
        )
        db.add(roadmap)
        db.commit()
        db.refresh(roadmap)

    return RoadmapVersionRead.model_validate(roadmap)


@router.post("/{hierarchy_id}/roadmap/review", response_model=RoadmapVersionRead)
def submit_roadmap_review(
    hierarchy_id: UUID,
    payload: RoadmapReviewSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoadmapVersionRead:
    """Admin's edited roadmap becomes the new, human-approved baseline version."""
    latest = db.scalars(
        select(RoadmapVersion)
        .where(RoadmapVersion.hierarchy_id == hierarchy_id)
        .order_by(RoadmapVersion.version_no.desc())
    ).first()
    next_version_no = (latest.version_no + 1) if latest else 1

    new_version = RoadmapVersion(
        hierarchy_id=hierarchy_id,
        version_no=next_version_no,
        extracted_json=payload.edited_json,
        approved_by=current_user.id,
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    return RoadmapVersionRead.model_validate(new_version)
