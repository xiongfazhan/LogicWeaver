"""Task service for managing workflow tasks."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Task, WorkflowStep


async def get_tasks_by_workflow(
    db: AsyncSession,
    workflow_id: UUID,
) -> List[Task]:
    """Get all tasks for a workflow, ordered by task_order."""
    result = await db.execute(
        select(Task)
        .where(Task.workflow_id == workflow_id)
        .options(selectinload(Task.steps))
        .order_by(Task.task_order)
    )
    return list(result.scalars().all())


async def get_task_by_id(
    db: AsyncSession,
    task_id: UUID,
) -> Optional[Task]:
    """Get a single task by ID."""
    result = await db.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(selectinload(Task.steps))
    )
    return result.scalar_one_or_none()


async def create_task(
    db: AsyncSession,
    workflow_id: UUID,
    name: str,
    task_order: int,
    description: Optional[str] = None,
) -> Task:
    """Create a new task."""
    task = Task(
        workflow_id=workflow_id,
        name=name,
        task_order=task_order,
        description=description,
        status="pending",
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def update_task(
    db: AsyncSession,
    task_id: UUID,
    name: Optional[str] = None,
    description: Optional[str] = None,
    status: Optional[str] = None,
) -> Optional[Task]:
    """Update a task."""
    task = await get_task_by_id(db, task_id)
    if not task:
        return None
    
    if name is not None:
        task.name = name
    if description is not None:
        task.description = description
    if status is not None:
        task.status = status
    
    await db.commit()
    await db.refresh(task)
    return task


async def delete_task(
    db: AsyncSession,
    task_id: UUID,
) -> bool:
    """Delete a task and all its steps."""
    task = await get_task_by_id(db, task_id)
    if not task:
        return False
    
    await db.delete(task)
    await db.commit()
    return True


async def reorder_tasks(
    db: AsyncSession,
    workflow_id: UUID,
    task_ids: List[UUID],
) -> List[Task]:
    """Reorder tasks by updating their task_order."""
    for i, task_id in enumerate(task_ids, start=1):
        result = await db.execute(
            select(Task).where(Task.id == task_id, Task.workflow_id == workflow_id)
        )
        task = result.scalar_one_or_none()
        if task:
            task.task_order = i
    
    await db.commit()
    return await get_tasks_by_workflow(db, workflow_id)
