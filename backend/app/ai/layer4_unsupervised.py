"""
backend/app/ai/layer4_unsupervised.py — P4 (roadmap item, not hackathon scope)

Isolation Forest fit per-hierarchy (never globally across hierarchies) on
structured transaction features. Unsupervised, so no labeled dataset is
needed — only build this if Layers 1-3 are done early; otherwise mention
it in the pitch as future work.
"""

from uuid import UUID

import numpy as np
from sklearn.ensemble import IsolationForest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.expense import Expense


def run_layer4_unsupervised(hierarchy_id: UUID, db: Session | None = None) -> list[Alert]:
    """Fit an Isolation Forest on this hierarchy's own expense features
    (amount, progress_value, upload hour-of-day) and flag the small
    fraction the model scores as outliers. Returns [] if there isn't
    enough data yet to fit meaningfully — unsupervised models still need
    a reasonable sample size, just not labels."""
    if db is None:
        return []

    expenses = db.scalars(
        select(Expense).join(Expense.node).where(Expense.node.has(hierarchy_id=hierarchy_id))
    ).all()

    MIN_SAMPLES = 20
    if len(expenses) < MIN_SAMPLES:
        return []

    features = np.array(
        [
            [
                float(e.amount),
                float(e.progress_value or 0),
                e.uploaded_at.hour,
            ]
            for e in expenses
        ]
    )

    model = IsolationForest(contamination=0.05, random_state=42)
    predictions = model.fit_predict(features)  # -1 = outlier, 1 = normal

    alerts: list[Alert] = []
    for expense, prediction in zip(expenses, predictions):
        if prediction == -1:
            alerts.append(
                Alert(
                    node_id=expense.node_id,
                    expense_id=expense.id,
                    layer="layer4",
                    severity="info",  # advisory only — always needs human review
                    message=f"Expense {expense.id} flagged as a statistical outlier by the "
                             f"unsupervised model for this hierarchy (not tied to a specific rule).",
                )
            )
    return alerts
