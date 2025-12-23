"""Task API router."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.services import task as task_service

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


# ============================================================================
# Schemas
# ============================================================================

class TaskCreate(BaseModel):
    """Request schema for creating a task."""
    name: str
    description: Optional[str] = None


class TaskUpdate(BaseModel):
    """Request schema for updating a task."""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class TaskResponse(BaseModel):
    """Response schema for a task."""
    id: UUID
    workflow_id: UUID
    name: str
    task_order: int
    description: Optional[str]
    status: str
    steps_count: int = 0

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Response schema for task list."""
    items: List[TaskResponse]


class ReorderRequest(BaseModel):
    """Request schema for reordering tasks."""
    task_ids: List[UUID]


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/workflow/{workflow_id}", response_model=TaskListResponse)
async def get_workflow_tasks(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Get all tasks for a workflow."""
    tasks = await task_service.get_tasks_by_workflow(db, workflow_id)
    return TaskListResponse(
        items=[
            TaskResponse(
                id=t.id,
                workflow_id=t.workflow_id,
                name=t.name,
                task_order=t.task_order,
                description=t.description,
                status=t.status,
                steps_count=len(t.steps) if t.steps else 0,
            )
            for t in tasks
        ]
    )


@router.post("/workflow/{workflow_id}", response_model=TaskResponse)
async def create_task(
    workflow_id: UUID,
    data: TaskCreate,
    db: AsyncSession = Depends(get_async_db),
):
    """Create a new task in a workflow."""
    # 获取当前最大 task_order
    existing_tasks = await task_service.get_tasks_by_workflow(db, workflow_id)
    next_order = len(existing_tasks) + 1
    
    task = await task_service.create_task(
        db,
        workflow_id=workflow_id,
        name=data.name,
        task_order=next_order,
        description=data.description,
    )
    
    return TaskResponse(
        id=task.id,
        workflow_id=task.workflow_id,
        name=task.name,
        task_order=task.task_order,
        description=task.description,
        status=task.status,
        steps_count=0,
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Get a single task by ID."""
    task = await task_service.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        id=task.id,
        workflow_id=task.workflow_id,
        name=task.name,
        task_order=task.task_order,
        description=task.description,
        status=task.status,
        steps_count=len(task.steps) if task.steps else 0,
    )


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_async_db),
):
    """Update a task."""
    task = await task_service.update_task(
        db,
        task_id=task_id,
        name=data.name,
        description=data.description,
        status=data.status,
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        id=task.id,
        workflow_id=task.workflow_id,
        name=task.name,
        task_order=task.task_order,
        description=task.description,
        status=task.status,
        steps_count=len(task.steps) if task.steps else 0,
    )


@router.delete("/{task_id}")
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Delete a task."""
    success = await task_service.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully"}


@router.post("/workflow/{workflow_id}/reorder", response_model=TaskListResponse)
async def reorder_tasks(
    workflow_id: UUID,
    data: ReorderRequest,
    db: AsyncSession = Depends(get_async_db),
):
    """Reorder tasks in a workflow."""
    tasks = await task_service.reorder_tasks(db, workflow_id, data.task_ids)
    return TaskListResponse(
        items=[
            TaskResponse(
                id=t.id,
                workflow_id=t.workflow_id,
                name=t.name,
                task_order=t.task_order,
                description=t.description,
                status=t.status,
                steps_count=len(t.steps) if t.steps else 0,
            )
            for t in tasks
        ]
    )
