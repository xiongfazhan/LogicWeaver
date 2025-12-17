"""Step API router."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.workflow import (
    RoutingBranchCreate,
    WorkflowStepCreate,
    WorkflowStepResponse,
    WorkflowStepUpdate,
)
from app.services.step import (
    StepNotFoundError,
    StepOrderConflictError,
    StepService,
    WorkflowNotFoundError,
)

router = APIRouter(prefix="/api/workflows", tags=["steps"])


def get_step_service(db: Session = Depends(get_db)) -> StepService:
    """Dependency to get step service."""
    return StepService(db)


@router.get("/{workflow_id}/steps", response_model=list[WorkflowStepResponse])
async def list_steps(
    workflow_id: UUID,
    service: Annotated[StepService, Depends(get_step_service)],
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=100, description="Items per page"),
) -> list[WorkflowStepResponse]:
    """
    List all steps for a workflow.

    - **workflow_id**: UUID of the workflow
    - **page**: Page number (default: 1)
    - **page_size**: Number of items per page (default: 100, max: 100)
    """
    try:
        return service.list_steps(workflow_id, page=page, page_size=page_size)
    except WorkflowNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )



@router.post(
    "/{workflow_id}/steps",
    response_model=WorkflowStepResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_step(
    workflow_id: UUID,
    data: WorkflowStepCreate,
    service: Annotated[StepService, Depends(get_step_service)],
    auto_order: bool = Query(
        False, description="Auto-assign step order (append to end)"
    ),
) -> WorkflowStepResponse:
    """
    Create a new step in a workflow.

    - **workflow_id**: UUID of the workflow
    - **auto_order**: If true, automatically assign step_order (append to end)
    - **name**: Step name (required)
    - **step_order**: Step order (required if auto_order is false)
    - **status**: Step status, 'pending' or 'completed' (default: 'pending')
    """
    try:
        if auto_order:
            return service.create_step_auto_order(workflow_id, data)
        return service.create_step(workflow_id, data)
    except WorkflowNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except StepOrderConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.get(
    "/{workflow_id}/steps/{step_id}",
    response_model=WorkflowStepResponse,
)
async def get_step(
    workflow_id: UUID,
    step_id: UUID,
    service: Annotated[StepService, Depends(get_step_service)],
) -> WorkflowStepResponse:
    """
    Get a step by ID.

    - **workflow_id**: UUID of the workflow
    - **step_id**: UUID of the step
    """
    try:
        step = service.get_step(step_id)
        # Verify step belongs to workflow
        if step.workflow_id != workflow_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Step {step_id} not found in workflow {workflow_id}",
            )
        return step
    except StepNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )



@router.put(
    "/{workflow_id}/steps/{step_id}",
    response_model=WorkflowStepResponse,
)
async def update_step(
    workflow_id: UUID,
    step_id: UUID,
    data: WorkflowStepUpdate,
    service: Annotated[StepService, Depends(get_step_service)],
) -> WorkflowStepResponse:
    """
    Update a step.

    - **workflow_id**: UUID of the workflow
    - **step_id**: UUID of the step
    - All fields are optional for partial updates
    """
    try:
        # First verify step exists and belongs to workflow
        step = service.get_step(step_id)
        if step.workflow_id != workflow_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Step {step_id} not found in workflow {workflow_id}",
            )
        return service.update_step(step_id, data)
    except StepNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except StepOrderConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.delete(
    "/{workflow_id}/steps/{step_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_step(
    workflow_id: UUID,
    step_id: UUID,
    service: Annotated[StepService, Depends(get_step_service)],
) -> None:
    """
    Delete a step.

    - **workflow_id**: UUID of the workflow
    - **step_id**: UUID of the step

    Note: Remaining steps will be automatically reordered.
    """
    try:
        # First verify step exists and belongs to workflow
        step = service.get_step(step_id)
        if step.workflow_id != workflow_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Step {step_id} not found in workflow {workflow_id}",
            )
        service.delete_step(step_id)
    except StepNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/{workflow_id}/steps/{step_id}/branches",
    response_model=WorkflowStepResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_routing_branch(
    workflow_id: UUID,
    step_id: UUID,
    data: RoutingBranchCreate,
    service: Annotated[StepService, Depends(get_step_service)],
) -> WorkflowStepResponse:
    """
    Add a routing branch to a step.

    - **workflow_id**: UUID of the workflow
    - **step_id**: UUID of the step
    - **condition_result**: Condition result (e.g., 'FAIL', 'UNSTABLE')
    - **action_type**: Action type (e.g., 'REJECT', 'ESCALATE')
    - **next_step_id**: Next step ID or 'end_process'
    """
    try:
        # First verify step exists and belongs to workflow
        step = service.get_step(step_id)
        if step.workflow_id != workflow_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Step {step_id} not found in workflow {workflow_id}",
            )
        return service.add_routing_branch(step_id, data)
    except StepNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete(
    "/{workflow_id}/steps/{step_id}/branches/{branch_id}",
    response_model=WorkflowStepResponse,
)
async def remove_routing_branch(
    workflow_id: UUID,
    step_id: UUID,
    branch_id: UUID,
    service: Annotated[StepService, Depends(get_step_service)],
) -> WorkflowStepResponse:
    """
    Remove a routing branch from a step.

    - **workflow_id**: UUID of the workflow
    - **step_id**: UUID of the step
    - **branch_id**: UUID of the branch to remove
    """
    try:
        # First verify step exists and belongs to workflow
        step = service.get_step(step_id)
        if step.workflow_id != workflow_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Step {step_id} not found in workflow {workflow_id}",
            )
        return service.remove_routing_branch(step_id, branch_id)
    except StepNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
