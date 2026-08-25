"""
backend/app/api/routes/nodes.py — P1

POST /nodes                          create node or submit node-creation request
GET  /nodes/{hierarchy_id}/tree      list all nodes for a hierarchy tree
GET  /nodes/{id}                     single node
GET  /nodes/{id}/children            lower nodes (tree drill-down)
GET  /nodes/{id}/ancestors           upper nodes
POST /nodes/requests/{id}/decision   approver approves/rejects a pending request
POST /nodes/requests/{id}/decide     approver decision alias
GET  /nodes/requests                 list pending requests
"""

from uuid import UUID
from decimal import Decimal
from typing import Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.node import Node
from app.models.node_creation_request import NodeCreationRequest
from app.models.roadmap_version import RoadmapVersion
from app.models.user import User
from app.schemas.node import (
    NodeApprovalDecision,
    NodeCreationRequestCreate,
    NodeCreationRequestRead,
    NodeRead,
)
from app.services.budget_validation import validate_cumulative_split

router = APIRouter()


@router.get("/{hierarchy_id}/tree", response_model=list[NodeRead])
def get_hierarchy_tree(
    hierarchy_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[NodeRead]:
    """Return all nodes in a given scheme hierarchy."""
    nodes = db.scalars(
        select(Node)
        .where(Node.hierarchy_id == hierarchy_id)
        .order_by(Node.created_at.asc())
    ).all()
    return [NodeRead.model_validate(n) for n in nodes]


@router.post("", response_model=NodeRead, status_code=status.HTTP_201_CREATED)
async def create_or_request_node(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NodeRead:
    """Supports direct node creation or child allocation request."""
    body = await request.json()
    
    hierarchy_id_raw = body.get("hierarchy_id")
    parent_id_raw = body.get("parent_id")
    role = body.get("role", "Sub-Tier Office")
    allocated_budget = Decimal(str(body.get("allocated_budget", 0)))
    user_id_raw = body.get("user_id") or str(current_user.id)

    parent = None
    if parent_id_raw:
        parent_id = UUID(str(parent_id_raw))
        parent = db.get(Node, parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent node not found")
        hierarchy_id = parent.hierarchy_id
        
        # Check budget availability
        if not validate_cumulative_split(db, parent, allocated_budget):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Requested allocation exceeds the parent node's remaining budget buffer.",
            )
        
        child_count = db.scalar(
            select(Node).where(Node.parent_id == parent.id)
        )
        new_suffix = f"{len(parent.path.split('.')) + 1}"
        new_path = f"{parent.path}.{new_suffix}"
    else:
        if not hierarchy_id_raw:
            raise HTTPException(status_code=422, detail="hierarchy_id is required for root node")
        hierarchy_id = UUID(str(hierarchy_id_raw))
        new_path = "1"

    node = Node(
        hierarchy_id=hierarchy_id,
        parent_id=parent.id if parent else None,
        path=new_path,
        user_id=UUID(str(user_id_raw)),
        role=role,
        allocated_budget=allocated_budget,
        status="active",
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return NodeRead.model_validate(node)


@router.get("/requests", response_model=list[NodeCreationRequestRead])
def list_node_requests(
    hierarchy_id: UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[NodeCreationRequestRead]:
    stmt = select(NodeCreationRequest).order_by(NodeCreationRequest.created_at.desc())
    requests = db.scalars(stmt).all()
    return [NodeCreationRequestRead.model_validate(r) for r in requests]


@router.post("/requests/{request_id}/decision", response_model=NodeCreationRequestRead)
@router.post("/requests/{request_id}/decide", response_model=NodeCreationRequestRead)
def decide_node_request(
    request_id: UUID,
    decision: NodeApprovalDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NodeCreationRequestRead:
    req = db.get(NodeCreationRequest, request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status not in ("pending",):
        raise HTTPException(status_code=400, detail=f"Request already {req.status}")

    req.approver_ids = (req.approver_ids or []) + [str(current_user.id)]

    if decision.approve:
        req.status = "approved"
    else:
        req.status = "rejected"

    db.commit()
    db.refresh(req)
    return NodeCreationRequestRead.model_validate(req)


@router.get("/{node_id}", response_model=NodeRead)
def get_node(
    node_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NodeRead:
    node = db.get(Node, node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")
    return NodeRead.model_validate(node)


@router.get("/{node_id}/children", response_model=list[NodeRead])
def get_children(
    node_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[NodeRead]:
    children = db.scalars(select(Node).where(Node.parent_id == node_id)).all()
    return [NodeRead.model_validate(c) for c in children]


@router.get("/{node_id}/ancestors", response_model=list[NodeRead])
def get_ancestors(
    node_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[NodeRead]:
    node = db.get(Node, node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")
    return [NodeRead.model_validate(a) for a in node.get_ancestors(db)]
