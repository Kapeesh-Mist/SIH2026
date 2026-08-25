"""
app/ai — anomaly detection layers (Person 4).

Re-exports the main entry point and layer functions so callers can do:

    from app.ai import AnomalyDetectionEngine
    engine = AnomalyDetectionEngine(db)
    engine.on_expense_uploaded(expense, roadmap, siblings=sibling_nodes)

instead of reaching into each layer file individually.
"""

from app.ai.detection_engine import AnomalyDetectionEngine
from app.ai.layer1_variance import compute_variance, run_layer1_variance
from app.ai.layer2_peer_comparison import run_layer2_peer_comparison
from app.ai.layer3_duplicate_ghost import (
    check_delay,
    check_duplicate_invoice,
    check_ghost_worker,
    check_missing_document,
)
from app.ai.layer4_unsupervised import run_layer4_unsupervised

__all__ = [
    "AnomalyDetectionEngine",
    "compute_variance",
    "run_layer1_variance",
    "run_layer2_peer_comparison",
    "check_duplicate_invoice",
    "check_ghost_worker",
    "check_missing_document",
    "check_delay",
    "run_layer4_unsupervised",
]
