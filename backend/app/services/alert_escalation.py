"""
backend/app/services/alert_escalation.py — P2

Two responsibilities, both meant to run on a schedule (APScheduler in the
hackathon build, a real cron/worker in production):
  1. Detect nodes that missed a periodic expenditure/progress upload.
  2. Escalate alerts that have stayed unresolved past a severity-scaled
     time window, walking them up the tree via Node.get_ancestors().
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.expense import Expense
from app.models.node import Node

# how long an alert can sit unresolved at each severity before escalating
ESCALATION_WINDOWS = {
    "info": timedelta(days=7),
    "warning": timedelta(days=3),
    "critical": timedelta(hours=24),
}

# how long a node can go without any expense upload before it's flagged
UPLOAD_OVERDUE_WINDOW = timedelta(days=14)


def check_overdue_uploads(db: Session) -> list[Alert]:
    """Find active nodes with no expense uploaded in the overdue window and
    create an alert on the immediate parent for each one."""
    now = datetime.now(timezone.utc)
    cutoff = now - UPLOAD_OVERDUE_WINDOW

    nodes = db.scalars(select(Node).where(Node.status == "active")).all()
    new_alerts: list[Alert] = []

    for node in nodes:
        last_expense = db.scalars(
            select(Expense).where(Expense.node_id == node.id).order_by(Expense.uploaded_at.desc())
        ).first()

        overdue = last_expense is None or last_expense.uploaded_at < cutoff
        if overdue and node.parent_id is not None:
            alert = Alert(
                node_id=node.parent_id,
                layer="layer3",
                severity="warning",
                message=f"Node {node.id} ({node.role}) has not uploaded an expense in over "
                         f"{UPLOAD_OVERDUE_WINDOW.days} days.",
            )
            db.add(alert)
            new_alerts.append(alert)

    db.commit()
    return new_alerts


def escalate_stale_alerts(db: Session) -> list[Alert]:
    """Push unresolved alerts up to the next ancestor once they've sat
    longer than their severity's escalation window."""
    now = datetime.now(timezone.utc)
    stale_alerts = db.scalars(select(Alert).where(Alert.resolved.is_(False))).all()
    escalated: list[Alert] = []

    for alert in stale_alerts:
        window = ESCALATION_WINDOWS.get(alert.severity, timedelta(days=7))
        if now - alert.created_at < window:
            continue

        current_node_id = alert.escalated_to_node_id or alert.node_id
        node = db.get(Node, current_node_id)
        if node is None or node.parent_id is None:
            continue  # already at the root, nowhere further to escalate

        alert.escalate(node.parent_id)
        escalated.append(alert)

    db.commit()
    return escalated
