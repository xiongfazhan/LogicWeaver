"""Workflow API router."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowListResponse,
    WorkflowResponse,
    WorkflowUpdate,
)
from app.services.workflow import WorkflowNotFoundError, WorkflowService

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


def get_workflow_service(db: Session = Depends(get_db)) -> WorkflowService:
    """Dependency to get workflow service."""
    return WorkflowService(db)


@router.get("", response_model=WorkflowListResponse)
async def list_workflows(
    service: Annotated[WorkflowService, Depends(get_workflow_service)],
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
) -> WorkflowListResponse:
    """
    List all workflows with pagination.

    - **page**: Page number (default: 1)
    - **page_size**: Number of items per page (default: 20, max: 100)
    """
    return service.list_workflows(page=page, page_size=page_size)


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    data: WorkflowCreate,
    service: Annotated[WorkflowService, Depends(get_workflow_service)],
) -> WorkflowResponse:
    """
    Create a new workflow.

    - **name**: Workflow name (required)
    - **description**: Workflow description (optional)
    - **cover_image_url**: Cover image URL (optional)
    - **status**: Workflow status, 'draft' or 'deployed' (default: 'draft')
    """
    return service.create_workflow(data)



@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: UUID,
    service: Annotated[WorkflowService, Depends(get_workflow_service)],
) -> WorkflowResponse:
    """
    Get a workflow by ID.

    - **workflow_id**: UUID of the workflow
    """
    try:
        return service.get_workflow(workflow_id)
    except WorkflowNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: UUID,
    data: WorkflowUpdate,
    service: Annotated[WorkflowService, Depends(get_workflow_service)],
) -> WorkflowResponse:
    """
    Update a workflow.

    - **workflow_id**: UUID of the workflow
    - **name**: New workflow name (optional)
    - **description**: New description (optional)
    - **cover_image_url**: New cover image URL (optional)
    - **status**: New status (optional)
    """
    try:
        return service.update_workflow(workflow_id, data)
    except WorkflowNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: UUID,
    service: Annotated[WorkflowService, Depends(get_workflow_service)],
) -> None:
    """
    Delete a workflow.

    - **workflow_id**: UUID of the workflow
    """
    try:
        service.delete_workflow(workflow_id)
    except WorkflowNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
