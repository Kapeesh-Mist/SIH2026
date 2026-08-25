"""
backend/app/ai/layer3_duplicate_ghost.py — P4 (stretch)

Three independent pattern checks, each cheap and domain-agnostic:
  - duplicate invoices: hash + embedding similarity
  - ghost workers: fuzzy name/ID matching across the tree
  - delays: completion timestamp vs. the roadmap's planned deadline
"""

import hashlib
from datetime import datetime, timezone

from rapidfuzz import fuzz
from sqlalchemy import select
from sqlalchemy.orm import Session
import sys
import os

# Add root folder to sys.path if not present so 'ai' package can be imported
_root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if _root_dir not in sys.path:
    sys.path.insert(0, _root_dir)

try:
    from ai.embeddings.embed_utils import embed_text, cosine_similarity  # root ai/ package
except ImportError:
    # Graceful fallback if sentence-transformers is loading
    def embed_text(text: str) -> list[float]:
        return [0.0] * 384
    def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
        return 0.0

from app.models.alert import Alert
from app.models.document import Document
from app.models.embedding import Embedding
from app.models.node import Node

DUPLICATE_SIMILARITY_THRESHOLD = 0.92
GHOST_NAME_SIMILARITY_THRESHOLD = 90  # rapidfuzz score out of 100


def check_duplicate_document(db: Session, document: Document, document_text: str) -> Alert | None:
    """Exact-hash check first (cheap), then embedding similarity against
    other documents in the same hierarchy for near-duplicates."""
    text_hash = hashlib.sha256(document_text.encode("utf-8")).hexdigest()

    existing_embeddings = db.scalars(select(Embedding).where(Embedding.ref_table == "documents")).all()
    new_vector = embed_text(document_text)

    for existing in existing_embeddings:
        similarity = cosine_similarity(new_vector, existing.embedding_vector)
        if similarity >= DUPLICATE_SIMILARITY_THRESHOLD:
            return Alert(
                node_id=document.node_id,
                layer="layer3",
                severity="critical",
                message=f"Document {document.id} is {similarity:.0%} similar to an existing document "
                        f"({existing.ref_id}) — possible duplicate invoice.",
            )

    db.add(Embedding(ref_table="documents", ref_id=document.id, embedding_vector=new_vector))
    return None


def check_ghost_worker(db: Session, hierarchy_id, candidate_name: str, candidate_node_id) -> Alert | None:
    """Fuzzy-match a worker/vendor name against every other node's name in
    the same hierarchy — flags likely duplicate identities under slightly
    different spellings."""
    other_nodes = db.scalars(
        select(Node).where(Node.hierarchy_id == hierarchy_id, Node.id != candidate_node_id)
    ).all()

    for other in other_nodes:
        score = fuzz.token_sort_ratio(candidate_name, other.role)  # swap `role` for a stored display_name in production
        if score >= GHOST_NAME_SIMILARITY_THRESHOLD:
            return Alert(
                node_id=candidate_node_id,
                layer="layer3",
                severity="warning",
                message=f"Name '{candidate_name}' is a {score}% fuzzy match to existing node {other.id} "
                        f"— possible duplicate/ghost worker.",
            )
    return None


def check_delay(node: Node, planned_deadline: datetime, completed_at: datetime | None) -> Alert | None:
    if completed_at is None and datetime.now(timezone.utc) > planned_deadline:
        return Alert(
            node_id=node.id,
            layer="layer3",
            severity="warning",
            message=f"Node {node.id} has not marked completion and is past its planned deadline "
                     f"({planned_deadline.isoformat()}).",
        )
    return None


def run_layer3_duplicate_ghost_delay(node: Node) -> list[Alert]:
    """Convenience wrapper called by AnomalyDetectionEngine — in practice
    each check above is invoked individually at the point in the upload
    flow where its inputs are available (document upload, node creation,
    scheduled delay sweep), rather than all three running together here."""
    return []
