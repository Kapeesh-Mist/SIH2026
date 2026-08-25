"""
Layer 2 -- Peer / Sibling Comparison (Section 4.3). [DECIDED, stretch]

Self-calibrating from the tree's own live data: no roadmap, no training
set. Flags a node whose spend/frequency is a statistical outlier versus
its siblings (same parent, same level) using both z-score and Median
Absolute Deviation (MAD is more robust to the small-N, fraud-skewed
samples you'll actually see in a demo tree).

Also doubles as an approval-pattern check per Section 4.3 / 7: pass in
node_creation_requests counts instead of spend amounts to flag a branch
or approver growing suspiciously fast (collusion mitigation).

Contract with P2: call after an expense is uploaded and verified, once
there are >= MIN_SIBLINGS_FOR_COMPARISON siblings with data -- with
fewer than that, a statistical outlier test is noise, not signal.
"""
from __future__ import annotations

import statistics

from app.models.alert import Alert, AlertLayer, AlertSeverity

MIN_SIBLINGS_FOR_COMPARISON = 4
Z_SCORE_WARNING = 2.0
Z_SCORE_CRITICAL = 3.0
MAD_CONSTANT = 1.4826  # scales MAD to be consistent with std dev for normal data


def _mad_z_scores(values: list[float]) -> list[float]:
    """Modified z-scores using median absolute deviation -- robust to the
    outliers you're specifically trying to detect (a handful of extreme
    values won't drag the baseline toward them the way mean/stdev would)."""
    median = statistics.median(values)
    abs_deviations = [abs(v - median) for v in values]
    mad = statistics.median(abs_deviations)
    if mad == 0:
        # all values identical (or all-but-one) -- fall back to a tiny
        # epsilon so we don't divide by zero; any deviation at all becomes
        # infinitely significant, which is arguably correct here
        mad = 1e-9
    return [(0.6745 * (v - median)) / mad for v in values]


def _severity_for_zscore(z: float) -> AlertSeverity | None:
    magnitude = abs(z)
    if magnitude >= Z_SCORE_CRITICAL:
        return AlertSeverity.CRITICAL
    if magnitude >= Z_SCORE_WARNING:
        return AlertSeverity.WARNING
    return None


def run_layer2_peer_comparison(node, siblings: list, value_fn=None) -> Alert | None:
    """
    node: the node being evaluated (P1's Node model instance; needs .id).
    siblings: list of sibling node/expense-aggregate objects at the same
        level under the same parent, INCLUDING `node` itself in the list
        (the function locates node's own value by matching id).
    value_fn: callable(obj) -> float, extracts the metric to compare
        (e.g. lambda n: n.total_spend, or a node_creation_requests count
        for the approval-pattern variant). Defaults to `.total_spend`.

    Returns None if there isn't enough sibling data yet, or the node's
    value isn't a statistical outlier.
    """
    if value_fn is None:
        value_fn = lambda obj: obj.total_spend  # noqa: E731

    if len(siblings) < MIN_SIBLINGS_FOR_COMPARISON:
        return None

    values = [value_fn(s) for s in siblings]
    z_scores = _mad_z_scores(values)

    node_index = next((i for i, s in enumerate(siblings) if s.id == node.id), None)
    if node_index is None:
        return None  # node wasn't in the sibling set we were given -- caller bug, fail soft

    node_z = z_scores[node_index]
    severity = _severity_for_zscore(node_z)
    if severity is None:
        return None

    direction = "above" if node_z > 0 else "below"
    alert = Alert(
        node_id=node.id,
        layer=AlertLayer.LAYER2_PEER_COMPARISON,
        severity=severity,
        message=(
            f"Node's value is a statistical outlier ({direction} its peers), "
            f"modified z-score {node_z:.2f} across {len(siblings)} siblings."
        ),
        details={
            "z_score": round(node_z, 3),
            "sibling_count": len(siblings),
            "node_value": values[node_index],
            "peer_median": statistics.median(values),
        },
        source_table="nodes",
        source_id=node.id,
    )
    return alert
