"""Step service for business logic."""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.workflow import RoutingBranch, WorkflowStep
from app.repositories.step import StepRepository
from app.repositories.workflow import WorkflowRepository
from app.schemas.workflow import (
    RoutingBranchCreate,
    WorkflowStepCreate,
    WorkflowStepResponse,
    WorkflowStepUpdate,
)


class StepNotFoundError(Exception):
    """Raised when a step is not found."""

    def __init__(self, step_id: UUID):
        self.step_id = step_id
        super().__init__(f"Step with id {step_id} not found")


class WorkflowNotFoundError(Exception):
    """Raised when a workflow is not found."""

    def __init__(self, workflow_id: UUID):
        self.workflow_id = workflow_id
        super().__init__(f"Workflow with id {workflow_id} not found")


class StepOrderConflictError(Exception):
    """Raised when step order conflicts."""

    def __init__(self, workflow_id: UUID, step_order: int):
        self.workflow_id = workflow_id
        self.step_order = step_order
        super().__init__(
            f"Step order {step_order} already exists in workflow {workflow_id}"
        )


class StepService:
    """Service for workflow step business logic."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repository = StepRepository(db)
        self.workflow_repository = WorkflowRepository(db)


    def create_step(
        self,
        workflow_id: UUID,
        data: WorkflowStepCreate,
    ) -> WorkflowStepResponse:
        """Create a new step in a workflow."""
        # Verify workflow exists
        if not self.workflow_repository.exists(workflow_id):
            raise WorkflowNotFoundError(workflow_id)

        # Check if step_order already exists
        if self.repository.check_order_exists(workflow_id, data.step_order):
            raise StepOrderConflictError(workflow_id, data.step_order)

        step = WorkflowStep(
            workflow_id=workflow_id,
            name=data.name,
            step_order=data.step_order,
            status=data.status,
            context_type=data.context_type,
            context_image_url=data.context_image_url,
            context_text_content=data.context_text_content,
            context_voice_transcript=data.context_voice_transcript,
            context_description=data.context_description,
            extraction_keywords=data.extraction_keywords,
            extraction_voice_transcript=data.extraction_voice_transcript,
            logic_strategy=data.logic_strategy,
            logic_rule_expression=data.logic_rule_expression,
            logic_evaluation_prompt=data.logic_evaluation_prompt,
            routing_default_next=data.routing_default_next,
        )
        created = self.repository.create(step)
        return WorkflowStepResponse.model_validate(created)

    def create_step_auto_order(
        self,
        workflow_id: UUID,
        data: WorkflowStepCreate,
    ) -> WorkflowStepResponse:
        """Create a new step with auto-assigned order (append to end)."""
        # Verify workflow exists
        if not self.workflow_repository.exists(workflow_id):
            raise WorkflowNotFoundError(workflow_id)

        # Get next order
        max_order = self.repository.get_max_order(workflow_id)
        next_order = max_order + 1

        step = WorkflowStep(
            workflow_id=workflow_id,
            name=data.name,
            step_order=next_order,
            status=data.status,
            context_type=data.context_type,
            context_image_url=data.context_image_url,
            context_text_content=data.context_text_content,
            context_voice_transcript=data.context_voice_transcript,
            context_description=data.context_description,
            extraction_keywords=data.extraction_keywords,
            extraction_voice_transcript=data.extraction_voice_transcript,
            logic_strategy=data.logic_strategy,
            logic_rule_expression=data.logic_rule_expression,
            logic_evaluation_prompt=data.logic_evaluation_prompt,
            routing_default_next=data.routing_default_next,
        )
        created = self.repository.create(step)
        return WorkflowStepResponse.model_validate(created)

    def get_step(self, step_id: UUID) -> WorkflowStepResponse:
        """Get a step by ID."""
        step = self.repository.get_by_id(step_id)
        if not step:
            raise StepNotFoundError(step_id)
        return WorkflowStepResponse.model_validate(step)

    def get_step_or_none(self, step_id: UUID) -> Optional[WorkflowStepResponse]:
        """Get a step by ID, return None if not found."""
        step = self.repository.get_by_id(step_id)
        if not step:
            return None
        return WorkflowStepResponse.model_validate(step)


    def list_steps(
        self,
        workflow_id: UUID,
        page: int = 1,
        page_size: int = 100,
    ) -> list[WorkflowStepResponse]:
        """List all steps for a workflow."""
        # Verify workflow exists
        if not self.workflow_repository.exists(workflow_id):
            raise WorkflowNotFoundError(workflow_id)

        skip = (page - 1) * page_size
        steps = self.repository.get_by_workflow_id(
            workflow_id, skip=skip, limit=page_size
        )
        return [WorkflowStepResponse.model_validate(s) for s in steps]

    def count_steps(self, workflow_id: UUID) -> int:
        """Count steps in a workflow."""
        if not self.workflow_repository.exists(workflow_id):
            raise WorkflowNotFoundError(workflow_id)
        return self.repository.count_by_workflow_id(workflow_id)

    def update_step(
        self,
        step_id: UUID,
        data: WorkflowStepUpdate,
    ) -> WorkflowStepResponse:
        """Update a step."""
        step = self.repository.get_by_id(step_id)
        if not step:
            raise StepNotFoundError(step_id)

        update_data = data.model_dump(exclude_unset=True)

        # Check for step_order conflict if updating order
        if "step_order" in update_data:
            new_order = update_data["step_order"]
            if new_order != step.step_order:
                if self.repository.check_order_exists(step.workflow_id, new_order):
                    raise StepOrderConflictError(step.workflow_id, new_order)

        updated = self.repository.update(step, update_data)
        return WorkflowStepResponse.model_validate(updated)

    def delete_step(self, step_id: UUID) -> None:
        """Delete a step and reorder remaining steps."""
        step = self.repository.get_by_id(step_id)
        if not step:
            raise StepNotFoundError(step_id)

        workflow_id = step.workflow_id
        deleted_order = step.step_order

        self.repository.delete(step)
        # Reorder remaining steps
        self.repository.reorder_steps_after_delete(workflow_id, deleted_order)

    def step_exists(self, step_id: UUID) -> bool:
        """Check if a step exists."""
        return self.repository.exists(step_id)

    def add_routing_branch(
        self,
        step_id: UUID,
        branch_data: RoutingBranchCreate,
    ) -> WorkflowStepResponse:
        """Add a routing branch to a step."""
        step = self.repository.get_by_id(step_id)
        if not step:
            raise StepNotFoundError(step_id)

        branch = RoutingBranch(
            step_id=step_id,
            condition_result=branch_data.condition_result,
            action_type=branch_data.action_type,
            next_step_id=branch_data.next_step_id,
        )
        self.db.add(branch)
        self.db.commit()
        self.db.refresh(step)
        return WorkflowStepResponse.model_validate(step)

    def remove_routing_branch(
        self,
        step_id: UUID,
        branch_id: UUID,
    ) -> WorkflowStepResponse:
        """Remove a routing branch from a step."""
        step = self.repository.get_by_id(step_id)
        if not step:
            raise StepNotFoundError(step_id)

        # Find and remove the branch
        branch_to_remove = None
        for branch in step.routing_branches:
            if branch.id == branch_id:
                branch_to_remove = branch
                break

        if branch_to_remove:
            self.db.delete(branch_to_remove)
            self.db.commit()
            self.db.refresh(step)

        return WorkflowStepResponse.model_validate(step)
