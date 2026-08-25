"""
seed-data/generate_synthetic_scheme.py

Builds a comprehensive demo hierarchy tree with multi-tier authority nodes,
simulated expense claims, and injected anomalies to test the 4 AI detection layers:
  - Layer 1: Variance from expected roadmap baseline ratio
  - Layer 2: Peer comparison outlier across sibling nodes
  - Layer 3: Duplicate invoice & ghost worker similarity
  - Layer 4: Unsupervised risk flag
"""

import sys
import os
from decimal import Decimal
import uuid

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from passlib.context import CryptContext
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.user import User
from app.models.hierarchy import Hierarchy
from app.models.roadmap_version import RoadmapVersion
from app.models.node import Node
from app.models.expense import Expense
from app.models.alert import Alert
from app.ai.detection_engine import AnomalyDetectionEngine

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed():
    db = SessionLocal()
    engine = AnomalyDetectionEngine()
    print("[INFO] Starting synthetic scheme generation...")

    try:
        # 1. Create or get Admin User
        admin_email = "admin@sih26102.gov.in"
        user = db.scalar(select(User).where(User.email == admin_email))
        if not user:
            user = User(
                email=admin_email,
                password_hash=pwd_context.hash("password123"),
                full_name="National Scheme Director",
                aadhaar_ref="XXXX-XXXX-9876",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"[OK] Created admin user: {user.email}")
        else:
            print(f"[OK] Using existing admin user: {user.email}")

        # 2. Create National Scheme Hierarchy
        scheme_name = "Pradhan Mantri Gram Sadak & Water Initiative (PMGSW-2026)"
        hierarchy = db.scalar(select(Hierarchy).where(Hierarchy.name == scheme_name))
        if not hierarchy:
            hierarchy = Hierarchy(
                name=scheme_name,
                description="Comprehensive rural connectivity, drinking water pipelines, and smart logistics infrastructure across 3 tier districts.",
                initial_budget=Decimal("50000000.00"),  # 5 Crore INR
                owner_id=user.id,
                status="active",
            )
            db.add(hierarchy)
            db.commit()
            db.refresh(hierarchy)
            print(f"[OK] Created Scheme: {hierarchy.name} (Budget: INR {hierarchy.initial_budget})")
        else:
            print(f"[OK] Using existing Scheme: {hierarchy.name}")

        # 3. Create Roadmap Version (Baseline)
        roadmap = db.scalar(select(RoadmapVersion).where(RoadmapVersion.hierarchy_id == hierarchy.id))
        if not roadmap:
            roadmap_json = {
                "categories": {
                    "materials": {
                        "amount": 20000000,
                        "expected_progress": 100,
                        "progress_unit": "km",
                        "expected_range": [500000, 5000000],
                        "timeline_days": 365,
                    },
                    "labour": {
                        "amount": 15000000,
                        "expected_progress": 500,
                        "progress_unit": "workers",
                        "expected_range": [200000, 2000000],
                        "timeline_days": 365,
                    },
                    "equipment": {
                        "amount": 10000000,
                        "expected_progress": 50,
                        "progress_unit": "units",
                        "expected_range": [100000, 1500000],
                        "timeline_days": 180,
                    },
                    "administration": {
                        "amount": 5000000,
                        "expected_progress": 12,
                        "progress_unit": "months",
                        "expected_range": [50000, 500000],
                        "timeline_days": 365,
                    },
                }
            }
            roadmap = RoadmapVersion(
                hierarchy_id=hierarchy.id,
                version_no=1,
                extracted_json=roadmap_json,
                approved_by=user.id,
            )
            db.add(roadmap)
            db.commit()
            db.refresh(roadmap)
            print(f"[OK] Created Roadmap Baseline v{roadmap.version_no}")

        # 4. Create Multi-Tier Node Hierarchy
        # Root Node
        root_node = db.scalar(select(Node).where(Node.hierarchy_id == hierarchy.id, Node.parent_id == None))
        if not root_node:
            root_node = Node(
                hierarchy_id=hierarchy.id,
                parent_id=None,
                path="1",
                user_id=user.id,
                role="State Project Apex Office",
                allocated_budget=Decimal("50000000.00"),
                status="active",
            )
            db.add(root_node)
            db.commit()
            db.refresh(root_node)
            print("[OK] Created Root Node: State Project Apex Office")

        # Tier 2: Districts
        d1 = db.scalar(select(Node).where(Node.hierarchy_id == hierarchy.id, Node.role == "District Office - North Zone"))
        if not d1:
            d1 = Node(
                hierarchy_id=hierarchy.id,
                parent_id=root_node.id,
                path=f"{root_node.path}.1",
                user_id=user.id,
                role="District Office - North Zone",
                allocated_budget=Decimal("25000000.00"),
                status="active",
            )
            db.add(d1)
            db.commit()
            db.refresh(d1)
            print("[OK] Created Sub-Node: District Office - North Zone")

        d2 = db.scalar(select(Node).where(Node.hierarchy_id == hierarchy.id, Node.role == "District Office - South Zone"))
        if not d2:
            d2 = Node(
                hierarchy_id=hierarchy.id,
                parent_id=root_node.id,
                path=f"{root_node.path}.2",
                user_id=user.id,
                role="District Office - South Zone",
                allocated_budget=Decimal("25000000.00"),
                status="active",
            )
            db.add(d2)
            db.commit()
            db.refresh(d2)
            print("[OK] Created Sub-Node: District Office - South Zone")

        # Tier 3: Blocks / Executive Units
        b1 = db.scalar(select(Node).where(Node.hierarchy_id == hierarchy.id, Node.role == "Block Unit - Alpha Pipeline"))
        if not b1:
            b1 = Node(
                hierarchy_id=hierarchy.id,
                parent_id=d1.id,
                path=f"{d1.path}.1",
                user_id=user.id,
                role="Block Unit - Alpha Pipeline",
                allocated_budget=Decimal("12000000.00"),
                status="active",
            )
            db.add(b1)
            db.commit()
            db.refresh(b1)
            print("[OK] Created Execution Node: Block Unit - Alpha Pipeline")

        # 5. Add Simulated Expenses & Trigger Anomaly Detection
        # Clean existing test expenses
        db.query(Expense).filter(Expense.node_id == b1.id).delete()
        db.commit()

        # Normal Expense
        exp1 = Expense(
            node_id=b1.id,
            category="materials",
            amount=Decimal("2000000.00"),
            progress_value=Decimal("10.0"),
            progress_unit="km",
            status="verified",
        )
        db.add(exp1)
        db.commit()
        db.refresh(exp1)

        # Injected Anomalous Expense 1 (Layer 1: High Cost Variance)
        # 40 Lakhs spent for only 1 km progress (4x expected baseline rate)
        exp2 = Expense(
            node_id=b1.id,
            category="materials",
            amount=Decimal("4000000.00"),
            progress_value=Decimal("1.0"),
            progress_unit="km",
            status="uploaded",
        )
        db.add(exp2)
        db.commit()
        db.refresh(exp2)

        # Evaluate Layer 1
        l1_alert = engine.run_layer1_variance(exp2, roadmap)
        if l1_alert:
            db.add(l1_alert)
            db.commit()
            print(f"[ALERT - AI Layer 1 Triggered] {l1_alert.message}")

        # Injected Anomalous Expense 2 (Layer 2: Peer Comparison Variance)
        l2_alert = engine.run_layer2_peer_comparison(d1, [d2])
        if l2_alert:
            db.add(l2_alert)
            db.commit()
            print(f"[ALERT - AI Layer 2 Triggered] {l2_alert.message}")

        # Injected Sample Alerts for Layer 3 (Ghost Worker / Duplicate)
        ghost_alert = Alert(
            node_id=b1.id,
            layer="layer3",
            severity="critical",
            message="Duplicate GST invoice detected: Invoice #GST-98231 matched 98% similarity with previous claim in South District.",
        )
        db.add(ghost_alert)

        # Layer 4 (Unsupervised ML Isolation Forest)
        l4_alerts = engine.run_layer4_unsupervised(hierarchy.id)
        for a in l4_alerts:
            db.add(a)

        db.commit()
        print("[SUCCESS] Synthetic Scheme & Anomaly Seed Data successfully generated!")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
