"""Workflow repository for database operations."""

from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.workflow import Workflow, WorkflowStep


class WorkflowRepository:
    """Repository for Workflow CRUD operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def create(self, workflow: Workflow) -> Workflow:
        """Create a new workflow."""
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def get_by_id(self, workflow_id: UUID) -> Optional[Workflow]:
        """Get a workflow by ID with all related data."""
        stmt = (
            select(Workflow)
            .options(
                selectinload(Workflow.steps)
                .selectinload(WorkflowStep.examples),
                selectinload(Workflow.steps)
                .selectinload(WorkflowStep.routing_branches),
            )
            .where(Workflow.id == workflow_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Workflow]:
        """Get all workflows with pagination."""
        stmt = (
            select(Workflow)
            .order_by(Workflow.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def count(self) -> int:
        """Count total workflows."""
        stmt = select(func.count(Workflow.id))
        return self.db.execute(stmt).scalar_one()


    def update(self, workflow: Workflow, data: dict) -> Workflow:
        """Update a workflow with given data."""
        for key, value in data.items():
            if hasattr(workflow, key) and value is not None:
                setattr(workflow, key, value)
        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def delete(self, workflow: Workflow) -> None:
        """Delete a workflow."""
        self.db.delete(workflow)
        self.db.commit()

    def exists(self, workflow_id: UUID) -> bool:
        """Check if a workflow exists."""
        stmt = select(Workflow.id).where(Workflow.id == workflow_id)
        return self.db.execute(stmt).scalar_one_or_none() is not None
