"""
Layer 3 -- Duplicate, Ghost, Document & Delay Detection (Section 4.4). [DECIDED]

Four independent checks, each returns Alert | None, kept separate so P2
can call whichever ones apply to the upload/event that just happened
rather than always running all four:

  - check_duplicate_invoice   : exact hash + embedding near-duplicate
  - check_ghost_worker        : fuzzy name/ID match across the tree
  - check_missing_document    : roadmap milestone doc checklist
  - check_delay               : completion timestamp vs roadmap deadline

Duplicate/ghost checks need embeddings + fuzzy matching (Section 6):
    pip install rapidfuzz
And the embed_text util from ai/embeddings/embed_utils.py -- imported
with a fallback below since PYTHONPATH wiring for the top-level ai/
folder wasn't nailed down as of the diagram (flag this to the team if
`sentence-transformers` import fails at runtime, easy 5-min fix either way).
"""
from __future__ import annotations

import hashlib
from datetime import datetime

from rapidfuzz import fuzz

from app.models.alert import Alert, AlertLayer, AlertSeverity

try:
    from ai.embeddings.embed_utils import embed_text, cosine_similarity  # repo root on PYTHONPATH
except ImportError:  # pragma: no cover
    from app.embeddings.embed_utils import embed_text, cosine_similarity  # copied into backend

NEAR_DUPLICATE_SIMILARITY_THRESHOLD = 0.92
GHOST_WORKER_FUZZY_THRESHOLD = 90  # rapidfuzz score, 0-100


# ---------------------------------------------------------------------------
# Duplicate invoices
# ---------------------------------------------------------------------------

def _content_hash(raw_bytes: bytes) -> str:
    return hashlib.sha256(raw_bytes).hexdigest()


def check_duplicate_invoice(document, sibling_documents: list, raw_bytes: bytes) -> Alert | None:
    """
    document: the just-uploaded Document (P1's model; needs .id, .node_id, .extracted_text).
    sibling_documents: other Document rows to compare against -- P2 should
        scope this query (e.g. same hierarchy, same document type, last N days)
        rather than passing the whole table.
    raw_bytes: the uploaded file's raw bytes, for exact-hash comparison.

    Exact duplicates (identical file) are always CRITICAL -- there's no
    ambiguity there. Near-duplicates (same invoice, different scan/OCR
    pass, minor edits) are flagged via embedding cosine similarity at
    WARNING, since it needs a human to actually confirm it's not just a
    similarly-worded but distinct invoice.
    """
    incoming_hash = _content_hash(raw_bytes)

    for sibling in sibling_documents:
        sibling_hash = getattr(sibling, "content_hash", None)
        if sibling_hash and sibling_hash == incoming_hash:
            return Alert(
                node_id=document.node_id,
                layer=AlertLayer.LAYER3_DUPLICATE,
                severity=AlertSeverity.CRITICAL,
                message=f"Exact duplicate of document {sibling.id}.",
                details={"match_type": "exact_hash", "duplicate_of": str(sibling.id)},
                source_table="documents",
                source_id=document.id,
            )

    incoming_vector = embed_text(document.extracted_text or "")
    for sibling in sibling_documents:
        sibling_vector = getattr(sibling, "embedding_vector", None)
        if not sibling_vector:
            continue
        similarity = cosine_similarity(incoming_vector, sibling_vector)
        if similarity >= NEAR_DUPLICATE_SIMILARITY_THRESHOLD:
            return Alert(
                node_id=document.node_id,
                layer=AlertLayer.LAYER3_DUPLICATE,
                severity=AlertSeverity.WARNING,
                message=f"Near-duplicate of document {sibling.id} (similarity {similarity:.2f}).",
                details={
                    "match_type": "embedding_similarity",
                    "duplicate_of": str(sibling.id),
                    "similarity": round(similarity, 4),
                },
                source_table="documents",
                source_id=document.id,
            )

    return None


# ---------------------------------------------------------------------------
# Ghost workers
# ---------------------------------------------------------------------------

def check_ghost_worker(new_worker, existing_workers: list) -> Alert | None:
    """
    new_worker / existing_workers: objects with .id, .name, .id_number
        (whatever unique ID the domain uses -- Aadhaar, employee ID, etc.).
    existing_workers should be scoped to the whole hierarchy tree, not
    just siblings -- a ghost worker duplicated across two different
    branches is exactly the pattern this catches.

    Fuzzy match on name AND id_number independently: a real duplicate
    person shows up as high similarity on both; a coincidental near-name-
    match (e.g. common names) with a different ID number is not flagged.
    """
    for existing in existing_workers:
        if existing.id == new_worker.id:
            continue

        name_score = fuzz.token_sort_ratio(new_worker.name or "", existing.name or "")
        id_score = fuzz.ratio(str(new_worker.id_number or ""), str(existing.id_number or ""))

        if name_score >= GHOST_WORKER_FUZZY_THRESHOLD and id_score >= GHOST_WORKER_FUZZY_THRESHOLD:
            return Alert(
                node_id=new_worker.id,
                layer=AlertLayer.LAYER3_GHOST_WORKER,
                severity=AlertSeverity.CRITICAL,
                message=(
                    f"Possible ghost/duplicate worker: matches existing "
                    f"worker {existing.id} (name {name_score}%, id {id_score}%)."
                ),
                details={
                    "matched_worker_id": str(existing.id),
                    "name_score": name_score,
                    "id_score": id_score,
                },
                source_table="nodes",
                source_id=new_worker.id,
            )

    return None


# ---------------------------------------------------------------------------
# Missing / unverified documents
# ---------------------------------------------------------------------------

def check_missing_document(node, milestone: dict, uploaded_documents: list) -> Alert | None:
    """
    milestone: one entry from the roadmap's document checklist, e.g.
        {"name": "completion_certificate", "required": True, "deadline": "2026-09-01"}
    uploaded_documents: Document rows uploaded by `node` for this milestone.

    Flags both "never uploaded" and "uploaded but never verified" --
    Section 3.3 requires an upper node to explicitly verify/reject, so an
    upload sitting unverified is itself part of what this checks for.
    """
    if not milestone.get("required", True):
        return None

    matching = [d for d in uploaded_documents if d.type == milestone.get("name")]

    if not matching:
        return Alert(
            node_id=node.id,
            layer=AlertLayer.LAYER3_MISSING_DOC,
            severity=AlertSeverity.WARNING,
            message=f"Required document '{milestone.get('name')}' has not been uploaded.",
            details={"milestone": milestone.get("name"), "status": "missing"},
            source_table="nodes",
            source_id=node.id,
        )

    if not any(getattr(d, "verified_at", None) for d in matching):
        return Alert(
            node_id=node.id,
            layer=AlertLayer.LAYER3_MISSING_DOC,
            severity=AlertSeverity.NORMAL,
            message=f"Document '{milestone.get('name')}' uploaded but not yet verified.",
            details={"milestone": milestone.get("name"), "status": "unverified"},
            source_table="documents",
            source_id=matching[0].id,
        )

    return None


# ---------------------------------------------------------------------------
# Delays
# ---------------------------------------------------------------------------

def check_delay(node, milestone: dict, completed_at: datetime | None, now: datetime | None = None) -> Alert | None:
    """
    milestone: roadmap entry with a "deadline" (ISO date string).
    completed_at: when the node actually marked/completed the task, or
        None if still incomplete.
    """
    now = now or datetime.utcnow()
    deadline_str = milestone.get("deadline")
    if not deadline_str:
        return None

    deadline = datetime.fromisoformat(deadline_str)
    reference_time = completed_at or now
    if reference_time <= deadline:
        return None

    days_late = (reference_time - deadline).days
    severity = AlertSeverity.CRITICAL if days_late > 14 else AlertSeverity.WARNING

    return Alert(
        node_id=node.id,
        layer=AlertLayer.LAYER3_DELAY,
        severity=severity,
        message=(
            f"Milestone '{milestone.get('name')}' is {days_late} day(s) "
            f"past its {deadline.date()} deadline"
            + (" and still incomplete." if completed_at is None else ".")
        ),
        details={
            "milestone": milestone.get("name"),
            "deadline": deadline_str,
            "days_late": days_late,
            "completed": completed_at is not None,
        },
        source_table="nodes",
        source_id=node.id,
    )
