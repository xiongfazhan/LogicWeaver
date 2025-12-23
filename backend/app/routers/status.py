"""Status flow API router."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.services import status as status_service

router = APIRouter(prefix="/api/status", tags=["status"])


# ============================================================================
# Schemas
# ============================================================================

class StatusResponse(BaseModel):
    """Response schema for workflow status."""
    id: UUID
    status: str
    label: str
    color: str
    allowed_transitions: list[str]


class TransitionRequest(BaseModel):
    """Request schema for status transition."""
    new_status: str


class TransitionResponse(BaseModel):
    """Response schema for status transition."""
    success: bool
    id: UUID | None = None
    status: str | None = None
    label: str | None = None
    color: str | None = None
    previous_status: str | None = None
    allowed_transitions: list[str] | None = None
    error: str | None = None


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/workflow/{workflow_id}", response_model=StatusResponse)
async def get_workflow_status(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Get current workflow status."""
    result = await status_service.get_workflow_status(db, workflow_id)
    if not result:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return StatusResponse(**result)


@router.post("/workflow/{workflow_id}/transition", response_model=TransitionResponse)
async def transition_workflow_status(
    workflow_id: UUID,
    data: TransitionRequest,
    db: AsyncSession = Depends(get_async_db),
):
    """Transition workflow to a specific status."""
    result = await status_service.transition_workflow_status(
        db, workflow_id, data.new_status
    )
    if not result:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return TransitionResponse(**result)


@router.post("/workflow/{workflow_id}/advance", response_model=TransitionResponse)
async def advance_workflow_status(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Advance workflow to the next status."""
    result = await status_service.advance_workflow_status(db, workflow_id)
    if not result:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return TransitionResponse(**result)


@router.post("/workflow/{workflow_id}/rollback", response_model=TransitionResponse)
async def rollback_workflow_status(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Rollback workflow to the previous status."""
    result = await status_service.rollback_workflow_status(db, workflow_id)
    if not result:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return TransitionResponse(**result)
