"""Utility module for vector embeddings generation and similarity search.

This module acts as a clean foundation placeholder for vector embeddings,
supporting future integrations with local models or external embedding APIs.
"""

from typing import List, Sequence
import math


def mock_embed_text(text: str, dimensions: int = 128) -> List[float]:
    """Generate a deterministic normalized pseudo-embedding vector for a given text string.

    Useful for offline testing and initial pipeline scaffolding.
    """
    if not text:
        return [0.0] * dimensions

    # Deterministic hash-based pseudo vector
    seed = sum(ord(c) for c in text)
    raw_vector = [
        math.sin(seed * (i + 1)) * math.cos(i + 0.5) for i in range(dimensions)
    ]
    # L2 Normalization
    magnitude = math.sqrt(sum(v * v for v in raw_vector)) or 1.0
    return [v / magnitude for v in raw_vector]


def cosine_similarity(vector_a: Sequence[float], vector_b: Sequence[float]) -> float:
    """Compute cosine similarity between two float vectors."""
    if len(vector_a) != len(vector_b):
        raise ValueError("Vector dimensions must match for cosine similarity.")

    dot_product = sum(a * b for a, b in zip(vector_a, vector_b))
    mag_a = math.sqrt(sum(a * a for a in vector_a))
    mag_b = math.sqrt(sum(b * b for b in vector_b))

    if mag_a == 0.0 or mag_b == 0.0:
        return 0.0

    return dot_product / (mag_a * mag_b)


class EmbeddingService:
    """Service wrapper for vector embedding operations."""

    def __init__(self, model_name: str = "mock-embedding-model"):
        self.model_name = model_name

    def generate_embedding(self, text: str) -> List[float]:
        """Generate text embedding vector."""
        return mock_embed_text(text)

    def find_most_similar(
        self, query_vector: List[float], candidate_vectors: List[List[float]]
    ) -> List[float]:
        """Return similarity scores against a list of candidates."""
        return [cosine_similarity(query_vector, cand) for cand in candidate_vectors]
