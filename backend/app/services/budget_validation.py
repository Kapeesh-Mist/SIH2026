"""
backend/app/services/budget_validation.py — P1

Python-side pre-check for the cumulative budget-split rule, so the API can
return a clean 400 before hitting the DB trigger defined in schema.sql
(trg_check_budget_split). The trigger remains the source of truth —
this function exists purely for a fast, friendly error message.
"""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.node import Node


def validate_cumulative_split(db: Session, parent_node: Node, new_amount: Decimal, exclude_node_id=None) -> bool:
    """True if (sum of parent's existing children's allocations, excluding
    exclude_node_id if updating an existing node) + new_amount does not
    exceed the parent's own allocated_budget."""
    stmt = select(Node).where(Node.parent_id == parent_node.id)
    if exclude_node_id is not None:
        stmt = stmt.where(Node.id != exclude_node_id)
    siblings = db.scalars(stmt).all()

    siblings_total = sum((s.allocated_budget for s in siblings), Decimal("0"))
    return (siblings_total + new_amount) <= parent_node.allocated_budget


def remaining_budget(db: Session, parent_node: Node) -> Decimal:
    """How much of the parent's budget is still unallocated to children —
    useful for the frontend to show 'you can allocate up to ₹X' inline."""
    stmt = select(Node).where(Node.parent_id == parent_node.id)
    siblings = db.scalars(stmt).all()
    siblings_total = sum((s.allocated_budget for s in siblings), Decimal("0"))
    return parent_node.allocated_budget - siblings_total
