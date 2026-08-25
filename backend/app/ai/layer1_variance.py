"""
backend/app/ai/layer1_variance.py — P4

Core detector: compares an expense's actual expenditure-vs-progress ratio
against the roadmap's expected ratio for that category. Pure arithmetic —
no ML model, which is why it needs no training dataset (see the master
document, Section 4.7).
"""

from app.models.alert import Alert
from app.models.expense import Expense
from app.models.roadmap_version import RoadmapVersion

# deviation -> severity tiers, as agreed in the solution document
WARNING_THRESHOLD = 0.10   # 10%
CRITICAL_THRESHOLD = 0.30  # 30%


def run_layer1_variance(expense: Expense, roadmap: RoadmapVersion) -> Alert | None:
    variance = expense.compute_variance(roadmap)
    if variance is None:
        return None  # no baseline for this category yet, or no progress_value uploaded

    abs_variance = abs(variance)
    if abs_variance < WARNING_THRESHOLD:
        return None  # within normal range, no alert

    severity = "critical" if abs_variance >= CRITICAL_THRESHOLD else "warning"
    direction = "higher" if variance > 0 else "lower"

    return Alert(
        node_id=expense.node_id,
        expense_id=expense.id,
        layer="layer1",
        severity=severity,
        message=(
            f"Expenditure-to-progress ratio for '{expense.category}' is "
            f"{abs_variance:.0%} {direction} than the planned ratio in the roadmap. "
            f"Amount: {expense.amount}, progress: {expense.progress_value} {expense.progress_unit or ''}."
        ),
    )
