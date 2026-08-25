"""
backend/app/ai/layer2_peer_comparison.py — P4 (stretch)

Compares a node against its siblings under the same parent, independent
of the roadmap. Self-calibrating from the tree's own live data — no
dataset needed, and it generalizes across domains by construction (see
master document, Layer 2).
"""

import statistics

from app.models.alert import Alert
from app.models.node import Node

MIN_SIBLINGS_FOR_COMPARISON = 3  # below this, peer comparison isn't statistically meaningful
Z_SCORE_THRESHOLD = 2.0


def run_layer2_peer_comparison(node: Node, siblings: list[Node]) -> Alert | None:
    """siblings should be every node with the same parent_id as `node`,
    excluding `node` itself, with their total uploaded expense amounts
    already summed by the caller into a comparable metric."""
    peer_totals = [float(s.allocated_budget) for s in siblings]  # swap for actual uploaded-spend totals in production
    if len(peer_totals) < MIN_SIBLINGS_FOR_COMPARISON:
        return None

    mean = statistics.mean(peer_totals)
    stdev = statistics.stdev(peer_totals) if len(peer_totals) > 1 else 0
    if stdev == 0:
        return None

    node_value = float(node.allocated_budget)
    z_score = (node_value - mean) / stdev

    if abs(z_score) < Z_SCORE_THRESHOLD:
        return None

    direction = "above" if z_score > 0 else "below"
    return Alert(
        node_id=node.id,
        layer="layer2",
        severity="warning" if abs(z_score) < 3 else "critical",
        message=(
            f"Node {node.id} ({node.role}) is {abs(z_score):.1f} standard deviations {direction} "
            f"its peer nodes under the same parent (peer mean: {mean:,.2f})."
        ),
    )
