"""Example service for business logic."""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.workflow import Example
from app.repositories.example import ExampleRepository
from app.repositories.step import StepRepository
from app.schemas.workflow import (
    ExampleCreate,
    ExampleResponse,
    ExampleUpdate,
)


class ExampleNotFoundError(Exception):
    """Raised when an example is not found."""

    def __init__(self, example_id: UUID):
        self.example_id = example_id
        super().__init__(f"Example with id {example_id} not found")


class StepNotFoundError(Exception):
    """Raised when a step is not found."""

    def __init__(self, step_id: UUID):
        self.step_id = step_id
        super().__init__(f"Step with id {step_id} not found")


class ExampleService:
    """Service for example business logic."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repository = ExampleRepository(db)
        self.step_repository = StepRepository(db)

    def create_example(
        self,
        step_id: UUID,
        data: ExampleCreate,
    ) -> ExampleResponse:
        """
        Create a new example for a step.
        
        The label (PASS/FAIL) is determined by the data provided,
        ensuring correct labeling based on upload zone.
        """
        # Verify step exists
        if not self.step_repository.exists(step_id):
            raise StepNotFoundError(step_id)

        example = Example(
            step_id=step_id,
            content=data.content,
            content_type=data.content_type,
            label=data.label,
            description=data.description,
        )
        created = self.repository.create(example)
        return ExampleResponse.model_validate(created)

    def get_example(self, example_id: UUID) -> ExampleResponse:
        """Get an example by ID."""
        example = self.repository.get_by_id(example_id)
        if not example:
            raise ExampleNotFoundError(example_id)
        return ExampleResponse.model_validate(example)

    def get_example_or_none(self, example_id: UUID) -> Optional[ExampleResponse]:
        """Get an example by ID, return None if not found."""
        example = self.repository.get_by_id(example_id)
        if not example:
            return None
        return ExampleResponse.model_validate(example)

    def list_examples_by_step(self, step_id: UUID) -> list[ExampleResponse]:
        """List all examples for a step."""
        # Verify step exists
        if not self.step_repository.exists(step_id):
            raise StepNotFoundError(step_id)

        examples = self.repository.get_by_step_id(step_id)
        return [ExampleResponse.model_validate(e) for e in examples]

    def list_passing_examples(self, step_id: UUID) -> list[ExampleResponse]:
        """List all passing examples for a step."""
        if not self.step_repository.exists(step_id):
            raise StepNotFoundError(step_id)

        examples = self.repository.get_by_step_id_and_label(step_id, "PASS")
        return [ExampleResponse.model_validate(e) for e in examples]

    def list_failing_examples(self, step_id: UUID) -> list[ExampleResponse]:
        """List all failing examples for a step."""
        if not self.step_repository.exists(step_id):
            raise StepNotFoundError(step_id)

        examples = self.repository.get_by_step_id_and_label(step_id, "FAIL")
        return [ExampleResponse.model_validate(e) for e in examples]


    def update_example(
        self,
        example_id: UUID,
        data: ExampleUpdate,
    ) -> ExampleResponse:
        """Update an example."""
        example = self.repository.get_by_id(example_id)
        if not example:
            raise ExampleNotFoundError(example_id)

        update_data = data.model_dump(exclude_unset=True)
        updated = self.repository.update(example, update_data)
        return ExampleResponse.model_validate(updated)

    def delete_example(self, example_id: UUID) -> None:
        """Delete an example."""
        example = self.repository.get_by_id(example_id)
        if not example:
            raise ExampleNotFoundError(example_id)

        self.repository.delete(example)

    def example_exists(self, example_id: UUID) -> bool:
        """Check if an example exists."""
        return self.repository.exists(example_id)

    def count_examples(self, step_id: UUID) -> int:
        """Count examples for a step."""
        if not self.step_repository.exists(step_id):
            raise StepNotFoundError(step_id)
        return self.repository.count_by_step_id(step_id)

    def count_passing_examples(self, step_id: UUID) -> int:
        """Count passing examples for a step."""
        if not self.step_repository.exists(step_id):
            raise StepNotFoundError(step_id)
        return self.repository.count_by_step_id_and_label(step_id, "PASS")

    def count_failing_examples(self, step_id: UUID) -> int:
        """Count failing examples for a step."""
        if not self.step_repository.exists(step_id):
            raise StepNotFoundError(step_id)
        return self.repository.count_by_step_id_and_label(step_id, "FAIL")
