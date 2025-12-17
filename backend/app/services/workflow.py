"""Workflow service for business logic."""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.workflow import Workflow
from app.repositories.workflow import WorkflowRepository
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowListResponse,
    WorkflowResponse,
    WorkflowSummary,
    WorkflowUpdate,
)


class WorkflowNotFoundError(Exception):
    """Raised when a workflow is not found."""

    def __init__(self, workflow_id: UUID):
        self.workflow_id = workflow_id
        super().__init__(f"Workflow with id {workflow_id} not found")


class WorkflowService:
    """Service for workflow business logic."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.repository = WorkflowRepository(db)

    def create_workflow(self, data: WorkflowCreate) -> WorkflowResponse:
        """Create a new workflow."""
        workflow = Workflow(
            name=data.name,
            description=data.description,
            cover_image_url=data.cover_image_url,
            status=data.status,
        )
        created = self.repository.create(workflow)
        return WorkflowResponse.model_validate(created)

    def get_workflow(self, workflow_id: UUID) -> WorkflowResponse:
        """Get a workflow by ID."""
        workflow = self.repository.get_by_id(workflow_id)
        if not workflow:
            raise WorkflowNotFoundError(workflow_id)
        return WorkflowResponse.model_validate(workflow)


    def get_workflow_or_none(self, workflow_id: UUID) -> Optional[WorkflowResponse]:
        """Get a workflow by ID, return None if not found."""
        workflow = self.repository.get_by_id(workflow_id)
        if not workflow:
            return None
        return WorkflowResponse.model_validate(workflow)

    def list_workflows(
        self,
        page: int = 1,
        page_size: int = 20,
    ) -> WorkflowListResponse:
        """List all workflows with pagination."""
        skip = (page - 1) * page_size
        workflows = self.repository.get_all(skip=skip, limit=page_size)
        total = self.repository.count()

        return WorkflowListResponse(
            items=[WorkflowSummary.model_validate(w) for w in workflows],
            total=total,
            page=page,
            page_size=page_size,
        )

    def update_workflow(
        self,
        workflow_id: UUID,
        data: WorkflowUpdate,
    ) -> WorkflowResponse:
        """Update a workflow."""
        workflow = self.repository.get_by_id(workflow_id)
        if not workflow:
            raise WorkflowNotFoundError(workflow_id)

        update_data = data.model_dump(exclude_unset=True)
        updated = self.repository.update(workflow, update_data)
        return WorkflowResponse.model_validate(updated)

    def delete_workflow(self, workflow_id: UUID) -> None:
        """Delete a workflow."""
        workflow = self.repository.get_by_id(workflow_id)
        if not workflow:
            raise WorkflowNotFoundError(workflow_id)
        self.repository.delete(workflow)

    def workflow_exists(self, workflow_id: UUID) -> bool:
        """Check if a workflow exists."""
        return self.repository.exists(workflow_id)
