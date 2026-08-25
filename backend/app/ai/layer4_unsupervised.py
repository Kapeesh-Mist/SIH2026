"""
Layer 4 -- Unplanned / Unsupervised Catch-All (Section 4.5). [ROADMAP]

Per the build order (Section 8.3), this is step 8 of 8: only build it
out if Layers 0-3 are done early. Left as a working stub so the pitch
can honestly say "implemented, tune-able" rather than "not started" if
you get to it, without costing time if you don't.

Fits an Isolation Forest PER HIERARCHY (never globally -- a "normal"
transaction pattern in one ministry's tree is meaningless noise in
another's), on structured features, unsupervised. No labeled data.
"""
from __future__ import annotations

import numpy as np
from sklearn.ensemble import IsolationForest

from app.models.alert import Alert, AlertLayer, AlertSeverity

MIN_SAMPLES_TO_FIT = 20  # below this, an Isolation Forest is just noise
CONTAMINATION = 0.05     # assume ~5% of transactions are anomalous, tune against demo dataset


def _expenses_to_feature_matrix(expenses: list) -> np.ndarray:
    """Minimal starter feature set -- amount, day-of-week, hours since
    previous upload from the same node. Extend once you see what the
    synthetic demo dataset's injected anomalies actually look like
    (Section 8.2 -- dataset shape isn't finalized yet either)."""
    rows = []
    prev_time = None
    for e in sorted(expenses, key=lambda x: x.uploaded_at):
        hours_since_prev = (
            (e.uploaded_at - prev_time).total_seconds() / 3600 if prev_time else 0.0
        )
        rows.append([e.amount, e.uploaded_at.weekday(), hours_since_prev])
        prev_time = e.uploaded_at
    return np.array(rows)


def run_layer4_unsupervised(hierarchy_id, expenses: list) -> list[Alert]:
    """
    expenses: ALL expense rows for one hierarchy (not just one node) --
        the model is fit per-hierarchy, per Section 4.5.

    Returns a list of Alerts (possibly empty) rather than a single
    Alert|None, since one fit/predict pass can flag several nodes at once.
    Advisory-only per the doc: pair this with a human review step, don't
    auto-escalate straight off Layer 4 the way Layer 1 does.
    """
    if len(expenses) < MIN_SAMPLES_TO_FIT:
        return []

    features = _expenses_to_feature_matrix(expenses)
    model = IsolationForest(contamination=CONTAMINATION, random_state=42)
    predictions = model.fit_predict(features)  # -1 = anomaly, 1 = normal
    scores = model.score_samples(features)     # lower = more anomalous

    sorted_expenses = sorted(expenses, key=lambda x: x.uploaded_at)
    alerts = []
    for expense, prediction, score in zip(sorted_expenses, predictions, scores):
        if prediction != -1:
            continue
        alerts.append(
            Alert(
                node_id=expense.node_id,
                layer=AlertLayer.LAYER4_UNSUPERVISED,
                severity=AlertSeverity.WARNING,  # advisory -- always human-reviewed, never critical alone
                message=(
                    "Flagged by unsupervised outlier model as unusual "
                    "relative to this hierarchy's own transaction pattern."
                ),
                details={
                    "anomaly_score": round(float(score), 4),
                    "amount": expense.amount,
                },
                source_table="expenses",
                source_id=expense.id,
            )
        )
    return alerts
