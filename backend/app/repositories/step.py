"""Step repository for database operations."""

from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.workflow import Example, RoutingBranch, WorkflowStep


class StepRepository:
    """Repository for WorkflowStep CRUD operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def create(self, step: WorkflowStep) -> WorkflowStep:
        """Create a new workflow step."""
        self.db.add(step)
        self.db.commit()
        self.db.refresh(step)
        return step

    def get_by_id(self, step_id: UUID) -> Optional[WorkflowStep]:
        """Get a step by ID with all related data."""
        stmt = (
            select(WorkflowStep)
            .options(
                selectinload(WorkflowStep.examples),
                selectinload(WorkflowStep.routing_branches),
            )
            .where(WorkflowStep.id == step_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_workflow_id(
        self,
        workflow_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[WorkflowStep]:
        """Get all steps for a workflow with pagination."""
        stmt = (
            select(WorkflowStep)
            .options(
                selectinload(WorkflowStep.examples),
                selectinload(WorkflowStep.routing_branches),
            )
            .where(WorkflowStep.workflow_id == workflow_id)
            .order_by(WorkflowStep.step_order)
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())


    def count_by_workflow_id(self, workflow_id: UUID) -> int:
        """Count total steps for a workflow."""
        stmt = select(func.count(WorkflowStep.id)).where(
            WorkflowStep.workflow_id == workflow_id
        )
        return self.db.execute(stmt).scalar_one()

    def get_max_order(self, workflow_id: UUID) -> int:
        """Get the maximum step_order for a workflow."""
        stmt = select(func.max(WorkflowStep.step_order)).where(
            WorkflowStep.workflow_id == workflow_id
        )
        result = self.db.execute(stmt).scalar_one_or_none()
        return result if result is not None else -1

    def update(self, step: WorkflowStep, data: dict) -> WorkflowStep:
        """Update a step with given data."""
        for key, value in data.items():
            if hasattr(step, key):
                setattr(step, key, value)
        self.db.commit()
        self.db.refresh(step)
        return step

    def delete(self, step: WorkflowStep) -> None:
        """Delete a step."""
        self.db.delete(step)
        self.db.commit()

    def exists(self, step_id: UUID) -> bool:
        """Check if a step exists."""
        stmt = select(WorkflowStep.id).where(WorkflowStep.id == step_id)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def reorder_steps_after_delete(
        self,
        workflow_id: UUID,
        deleted_order: int,
    ) -> None:
        """Reorder steps after a step is deleted."""
        stmt = (
            select(WorkflowStep)
            .where(WorkflowStep.workflow_id == workflow_id)
            .where(WorkflowStep.step_order > deleted_order)
            .order_by(WorkflowStep.step_order)
        )
        steps = list(self.db.execute(stmt).scalars().all())
        for step in steps:
            step.step_order -= 1
        self.db.commit()

    def check_order_exists(self, workflow_id: UUID, step_order: int) -> bool:
        """Check if a step with given order exists in workflow."""
        stmt = (
            select(WorkflowStep.id)
            .where(WorkflowStep.workflow_id == workflow_id)
            .where(WorkflowStep.step_order == step_order)
        )
        return self.db.execute(stmt).scalar_one_or_none() is not None
