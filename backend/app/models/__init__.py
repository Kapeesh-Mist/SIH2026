"""
backend/app/models/__init__.py

Import every model here so `Base.metadata` (used by Alembic's
`target_metadata` and by `Base.metadata.create_all()` in tests) sees the
full schema regardless of which module first imports `Base`.
"""

from app.models.base import Base
from app.models.user import User
from app.models.hierarchy import Hierarchy
from app.models.roadmap_version import RoadmapVersion
from app.models.node import Node
from app.models.node_creation_request import NodeCreationRequest
from app.models.expense import Expense
from app.models.document import Document
from app.models.alert import Alert
from app.models.embedding import Embedding

__all__ = [
    "Base",
    "User",
    "Hierarchy",
    "RoadmapVersion",
    "Node",
    "NodeCreationRequest",
    "Expense",
    "Document",
    "Alert",
    "Embedding",
]