"""Simplified Steps API router - direct access without workflow_id."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_async_db
from app.models import WorkflowStep

router = APIRouter(prefix="/api/steps", tags=["steps-simple"])


# Simple update schema
class StepUpdateSimple(BaseModel):
    """Simple schema for updating step fields."""
    context_description: Optional[str] = None
    expert_notes: Optional[str] = None
    status: Optional[str] = None


class StepResponse(BaseModel):
    """Response schema for a step."""
    id: UUID
    name: str
    step_order: int
    context_description: Optional[str]
    expert_notes: Optional[str]
    status: str
    
    class Config:
        from_attributes = True


@router.patch("/{step_id}", response_model=StepResponse)
async def update_step_simple(
    step_id: UUID,
    data: StepUpdateSimple,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Update a step directly by ID (simplified, no workflow_id needed).
    Useful for worker/expert pages to update step content.
    """
    result = await db.execute(
        select(WorkflowStep).where(WorkflowStep.id == step_id)
    )
    step = result.scalar_one_or_none()
    
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    # Update fields if provided
    if data.context_description is not None:
        step.context_description = data.context_description
    if data.expert_notes is not None:
        step.expert_notes = data.expert_notes
    if data.status is not None:
        step.status = data.status
    
    await db.commit()
    await db.refresh(step)
    
    return StepResponse(
        id=step.id,
        name=step.name,
        step_order=step.step_order,
        context_description=step.context_description,
        expert_notes=step.expert_notes,
        status=step.status,
    )


@router.get("/{step_id}", response_model=StepResponse)
async def get_step_simple(
    step_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Get a step by ID (simplified)."""
    result = await db.execute(
        select(WorkflowStep).where(WorkflowStep.id == step_id)
    )
    step = result.scalar_one_or_none()
    
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    return StepResponse(
        id=step.id,
        name=step.name,
        step_order=step.step_order,
        context_description=step.context_description,
        expert_notes=step.expert_notes,
        status=step.status,
    )


# Schema for creating a step
class StepCreateSimple(BaseModel):
    """Schema for creating a step under a task."""
    name: str
    task_id: UUID


@router.post("/task/{task_id}", response_model=StepResponse)
async def create_step_for_task(
    task_id: UUID,
    data: StepCreateSimple,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Create a new step under a specific task.
    Automatically assigns step_order based on existing steps in the workflow.
    """
    from app.models import Task
    from sqlalchemy import func
    
    # Verify task exists and get workflow_id
    task_result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get next step_order for this WORKFLOW (not task, due to unique constraint)
    order_result = await db.execute(
        select(func.coalesce(func.max(WorkflowStep.step_order), 0) + 1)
        .where(WorkflowStep.workflow_id == task.workflow_id)
    )
    next_order = order_result.scalar()
    
    # Create the step
    new_step = WorkflowStep(
        workflow_id=task.workflow_id,
        task_id=task_id,
        name=data.name,
        step_order=next_order,
        status="pending",
    )
    db.add(new_step)
    await db.commit()
    await db.refresh(new_step)
    
    return StepResponse(
        id=new_step.id,
        name=new_step.name,
        step_order=new_step.step_order,
        context_description=new_step.context_description,
        expert_notes=new_step.expert_notes,
        status=new_step.status,
    )


@router.delete("/{step_id}")
async def delete_step(
    step_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Delete a step by ID."""
    result = await db.execute(
        select(WorkflowStep).where(WorkflowStep.id == step_id)
    )
    step = result.scalar_one_or_none()
    
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    await db.delete(step)
    await db.commit()
    
    return {"message": "Step deleted successfully"}
