"""Example repository for database operations."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.workflow import Example


class ExampleRepository:
    """Repository for Example CRUD operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def create(self, example: Example) -> Example:
        """Create a new example."""
        self.db.add(example)
        self.db.commit()
        self.db.refresh(example)
        return example

    def get_by_id(self, example_id: UUID) -> Optional[Example]:
        """Get an example by ID."""
        stmt = select(Example).where(Example.id == example_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_step_id(self, step_id: UUID) -> list[Example]:
        """Get all examples for a step."""
        stmt = (
            select(Example)
            .where(Example.step_id == step_id)
            .order_by(Example.created_at)
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_by_step_id_and_label(
        self,
        step_id: UUID,
        label: str,
    ) -> list[Example]:
        """Get examples for a step filtered by label."""
        stmt = (
            select(Example)
            .where(Example.step_id == step_id)
            .where(Example.label == label)
            .order_by(Example.created_at)
        )
        return list(self.db.execute(stmt).scalars().all())


    def update(self, example: Example, data: dict) -> Example:
        """Update an example with given data."""
        for key, value in data.items():
            if hasattr(example, key):
                setattr(example, key, value)
        self.db.commit()
        self.db.refresh(example)
        return example

    def delete(self, example: Example) -> None:
        """Delete an example."""
        self.db.delete(example)
        self.db.commit()

    def exists(self, example_id: UUID) -> bool:
        """Check if an example exists."""
        stmt = select(Example.id).where(Example.id == example_id)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def count_by_step_id(self, step_id: UUID) -> int:
        """Count examples for a step."""
        from sqlalchemy import func

        stmt = select(func.count(Example.id)).where(Example.step_id == step_id)
        return self.db.execute(stmt).scalar_one()

    def count_by_step_id_and_label(self, step_id: UUID, label: str) -> int:
        """Count examples for a step filtered by label."""
        from sqlalchemy import func

        stmt = (
            select(func.count(Example.id))
            .where(Example.step_id == step_id)
            .where(Example.label == label)
        )
        return self.db.execute(stmt).scalar_one()
