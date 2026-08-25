"""
ai/detection_engine.py

AnomalyDetectionEngine -- the single entry point P2's routes call after
every expense/document upload (Section 4, intro). Wraps all four layers
so P2 doesn't need to import/orchestrate them individually; it just
calls the method matching the event that happened and persists whatever
comes back.

Hour-1 kickoff contract with P2 (per the build-plan doc): the function
signature `run_layer1_variance(expense, roadmap) -> Alert | None` is
locked. Everything else here can change without breaking P2's side as
long as that one holds.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.ai.layer1_variance import run_layer1_variance
from app.ai.layer2_peer_comparison import run_layer2_peer_comparison
from app.ai.layer3_duplicate_ghost import (
    check_delay,
    check_duplicate_invoice,
    check_ghost_worker,
    check_missing_document,
)
from app.ai.layer4_unsupervised import run_layer4_unsupervised
from app.models.alert import Alert


class AnomalyDetectionEngine:
    """
    Usage from P2's api/routes/expenses.py, right after committing a new
    expense:

        from app.ai.detection_engine import AnomalyDetectionEngine

        engine = AnomalyDetectionEngine(db)
        engine.on_expense_uploaded(expense, roadmap, siblings=sibling_nodes)

    `db` is the request-scoped SQLAlchemy Session (from P1's deps.py).
    Every `on_*` method persists whatever alerts it generates and returns
    the list, so callers can also use the return value to decide whether
    to short-circuit anything in the response (e.g. flag it in the API
    response to the uploading node immediately).
    """

    def __init__(self, db: Session):
        self.db = db

    def _persist(self, alert: Alert | None) -> list[Alert]:
        if alert is None:
            return []
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return [alert]

    # ------------------------------------------------------------------
    # Called after an expense upload
    # ------------------------------------------------------------------
    def on_expense_uploaded(self, expense, roadmap: dict, siblings: list | None = None) -> list[Alert]:
        alerts: list[Alert] = []

        # Layer 1 -- always runs, pure arithmetic, cheapest check
        alerts += self._persist(run_layer1_variance(expense, roadmap, db_session=self.db))

        # Layer 2 -- only meaningful once there's enough sibling data
        if siblings:
            alert = run_layer2_peer_comparison(expense, siblings)
            alerts += self._persist(alert)

        return alerts

    # ------------------------------------------------------------------
    # Called after a document upload
    # ------------------------------------------------------------------
    def on_document_uploaded(
        self,
        document,
        raw_bytes: bytes,
        sibling_documents: list,
    ) -> list[Alert]:
        alerts: list[Alert] = []
        alert = check_duplicate_invoice(document, sibling_documents, raw_bytes)
        alerts += self._persist(alert)
        return alerts

    # ------------------------------------------------------------------
    # Called when a node is created (worker/vendor added to the tree)
    # ------------------------------------------------------------------
    def on_worker_node_created(self, new_worker, existing_workers: list) -> list[Alert]:
        alert = check_ghost_worker(new_worker, existing_workers)
        return self._persist(alert)

    # ------------------------------------------------------------------
    # Called by the scheduled job (services/alert_escalation.py's
    # check_overdue_uploads(), or its own scheduler) against every
    # active milestone
    # ------------------------------------------------------------------
    def on_milestone_check(
        self,
        node,
        milestone: dict,
        uploaded_documents: list,
        completed_at: datetime | None,
    ) -> list[Alert]:
        alerts: list[Alert] = []
        alerts += self._persist(check_missing_document(node, milestone, uploaded_documents))
        alerts += self._persist(check_delay(node, milestone, completed_at))
        return alerts

    # ------------------------------------------------------------------
    # Layer 4 -- run separately, e.g. as a nightly job per hierarchy,
    # not inline on every upload (it needs the full transaction history
    # to fit against)
    # ------------------------------------------------------------------
    def run_unsupervised_sweep(self, hierarchy_id, expenses: list) -> list[Alert]:
        alerts = run_layer4_unsupervised(hierarchy_id, expenses)
        for alert in alerts:
            self.db.add(alert)
        if alerts:
            self.db.commit()
            for alert in alerts:
                self.db.refresh(alert)
        return alerts
