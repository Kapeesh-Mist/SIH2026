"""
backend/app/ai/detection_engine.py — P4

Orchestrator class implementing AnomalyDetectionEngine from the class
diagram. Each run_layerN_* method is intentionally independent — no layer
depends on another succeeding, so a bug or a skipped stretch layer never
blocks the others.
"""

from app.ai.layer1_variance import run_layer1_variance
from app.ai.layer2_peer_comparison import run_layer2_peer_comparison
from app.ai.layer3_duplicate_ghost import run_layer3_duplicate_ghost_delay
from app.models.alert import Alert
from app.models.expense import Expense
from app.models.node import Node
from app.models.node_creation_request import NodeCreationRequest
from app.models.roadmap_version import RoadmapVersion


class AnomalyDetectionEngine:
    def run_layer0_legitimacy(self, request: NodeCreationRequest) -> Alert | None:
        """Layer 0 itself is mostly rule-based routing (see
        api/routes/nodes.py: request_new_node) — this hook is for the
        optional LLM advisory plausibility read on the justification text.
        Returns an info-severity Alert if the justification looks vague or
        inconsistent with the template category; never blocks approval."""
        return None  # stretch — wire an LLM call here if time allows

    def run_layer1_variance(self, expense: Expense, roadmap: RoadmapVersion) -> Alert | None:
        return run_layer1_variance(expense, roadmap)

    def run_layer2_peer_comparison(self, node: Node, siblings: list[Node]) -> Alert | None:
        return run_layer2_peer_comparison(node, siblings)

    def run_layer3_duplicate_ghost_delay(self, node: Node) -> list[Alert]:
        return run_layer3_duplicate_ghost_delay(node)

    def run_layer4_unsupervised(self, hierarchy_id) -> list[Alert]:
        # Roadmap item — Isolation Forest fit per-hierarchy. Not built for
        # the hackathon demo; see ai/layer4_unsupervised.py for the stub.
        from app.ai.layer4_unsupervised import run_layer4_unsupervised

        return run_layer4_unsupervised(hierarchy_id)
