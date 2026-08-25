# db/migrations/

This folder holds Alembic migrations — do not hand-write schema files here.

## One-time setup (already scaffolds this folder's real contents)

```bash
cd backend
alembic init app/db/migrations
```

Then in `alembic.ini`, point `sqlalchemy.url` at `settings.database_url`
(or read it dynamically in `env.py` via `from app.config import settings`),
and in `env.py` set:

```python
from app.models.base import Base
target_metadata = Base.metadata
```

## Day-to-day workflow

```bash
# after changing/adding a model in app/models/
alembic revision --autogenerate -m "add alerts table"
alembic upgrade head
```

Every schema change becomes a numbered file in this folder and is committed
to Git — this is what lets two people share one database safely (see the
"master text" doc, Section: shared DB in production).

The initial migration should mirror `docs/schema.sql` exactly (same tables,
same trigger on `nodes` enforcing the cumulative budget-split rule).
