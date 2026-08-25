"""
ai/embeddings/embed_utils.py — P4

Shared embedding helpers used by layer3_duplicate_ghost.py for
duplicate/near-duplicate document detection via pgvector cosine similarity.
"""

import sys
import os
import importlib
import numpy as np

# Add backend directory to sys.path so app.config can be resolved
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend"))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

_model = None


def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            try:
                config_mod = importlib.import_module("app.config")
                model_name = getattr(config_mod.settings, "embedding_model", "all-MiniLM-L6-v2")
            except Exception:
                model_name = "all-MiniLM-L6-v2"
            _model = SentenceTransformer(model_name)
        except Exception:
            _model = False
    return _model


def embed_text(text: str) -> list[float]:
    """Returns a 384-dim embedding vector for the given text, ready to
    store in the `embeddings` table's pgvector column."""
    model = _get_model()
    if not model:
        return [0.0] * 384
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Cosine similarity between two vectors already normalized by
    embed_text() — for normalized vectors this is just the dot product.
    Kept as an explicit function so callers don't have to know that."""
    a = np.array(vec_a)
    b = np.array(vec_b)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)
