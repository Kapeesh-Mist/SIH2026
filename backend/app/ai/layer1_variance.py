"""
Layer 1 -- Plan vs. Actual Variance (Section 4.2). [DECIDED]

Pure arithmetic, no model. Compares an uploaded expense against the
matching line item in the hierarchy's validated roadmap baseline and
buckets the deviation into severity tiers:

    < 10%   -> normal    (no alert persisted)
    10-30%  -> warning
    > 30%   -> critical

Contract with P2 (api/routes/expenses.py):
    After an expense row is committed, call:
        alert = run_layer1_variance(expense, roadmap, db)
    `roadmap` is the hierarchy's current roadmap_versions.extracted_json
    (already validated/human-edited per Section 3.1) -- P2/P1 fetch it,
    this function doesn't.
"""
from __future__ import annotations

from app.models.alert import Alert, AlertLayer, AlertSeverity

WARNING_THRESHOLD = 0.10   # 10%
CRITICAL_THRESHOLD = 0.30  # 30%


def _find_roadmap_line(roadmap: dict, category: str) -> dict | None:
    """Roadmap JSON shape is still [OPEN] per Section 8.2 -- this assumes
    a flat `line_items` list keyed by category. Update this lookup once
    the extraction schema is finalized; nothing else in this file should
    need to change."""
    for item in roadmap.get("line_items", []):
        if item.get("category") == category:
            return item
    return None


def compute_variance(actual_amount: float, planned_amount: float) -> float:
    """Signed relative deviation of actual from planned. Positive = overspend."""
    if planned_amount == 0:
        # no baseline to compare against -- treat any spend as maximal deviation
        # rather than dividing by zero or silently skipping the check
        return 1.0 if actual_amount > 0 else 0.0
    return (actual_amount - planned_amount) / planned_amount


def _severity_for(deviation: float) -> AlertSeverity | None:
    magnitude = abs(deviation)
    if magnitude > CRITICAL_THRESHOLD:
        return AlertSeverity.CRITICAL
    if magnitude > WARNING_THRESHOLD:
        return AlertSeverity.WARNING
    return None  # normal -- no alert


def run_layer1_variance(expense, roadmap: dict, db_session=None) -> Alert | None:
    """
    expense: P1's Expense model instance. Expected attributes:
        id, node_id, category, amount
    roadmap: dict, the validated roadmap_versions.extracted_json for this hierarchy.
    db_session: optional SQLAlchemy session -- if provided, the Alert is
        added+committed here; if None, the caller (P2) is responsible for
        persisting the returned Alert.

    Returns None when the deviation is within normal range (<10%) --
    P2 should treat None as "nothing to do", not an error.
    """
    line = _find_roadmap_line(roadmap, expense.category)
    planned_amount = line.get("expected_amount", 0) if line else 0

    deviation = compute_variance(expense.amount, planned_amount)
    severity = _severity_for(deviation)
    if severity is None:
        return None

    alert = Alert(
        node_id=expense.node_id,
        layer=AlertLayer.LAYER1_VARIANCE,
        severity=severity,
        message=(
            f"Expense in '{expense.category}' deviates "
            f"{deviation * 100:.1f}% from the roadmap baseline "
            f"({expense.amount} actual vs {planned_amount} planned)."
        ),
        details={
            "category": expense.category,
            "actual_amount": expense.amount,
            "planned_amount": planned_amount,
            "deviation_pct": round(deviation * 100, 2),
        },
        source_table="expenses",
        source_id=expense.id,
    )

    if db_session is not None:
        db_session.add(alert)
        db_session.commit()
        db_session.refresh(alert)

    return alert
