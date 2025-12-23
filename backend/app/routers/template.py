"""Template API router."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.services import template as template_service

router = APIRouter(prefix="/api/templates", tags=["templates"])


# ============================================================================
# Schemas
# ============================================================================

class TemplateTaskInfo(BaseModel):
    """Template task info for display."""
    name: str
    steps_count: int


class TemplateResponse(BaseModel):
    """Response schema for a template."""
    id: UUID
    name: str
    description: Optional[str]
    cover_image_url: Optional[str]
    tasks: List[TemplateTaskInfo]

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    """Response schema for template list."""
    items: List[TemplateResponse]


class CreateFromTemplateRequest(BaseModel):
    """Request schema for creating workflow from template."""
    name: str
    description: Optional[str] = None


class WorkflowCreatedResponse(BaseModel):
    """Response schema for created workflow."""
    id: UUID
    name: str
    description: Optional[str]
    status: str


# ============================================================================
# Endpoints
# ============================================================================

@router.get("", response_model=TemplateListResponse)
async def get_templates(
    db: AsyncSession = Depends(get_async_db),
):
    """Get all available templates."""
    from sqlalchemy import select, text
    from app.models import Workflow, Task
    
    try:
        # 简单查询，不使用 selectinload
        result = await db.execute(
            select(Workflow)
            .where(Workflow.is_template == True)
            .order_by(Workflow.created_at)
        )
        templates = list(result.scalars().all())
        
        items = []
        for t in templates:
            # 单独查询 tasks
            tasks_result = await db.execute(
                select(Task)
                .where(Task.workflow_id == t.id)
                .order_by(Task.task_order)
            )
            tasks = list(tasks_result.scalars().all())
            
            task_infos = []
            for task in tasks:
                # 使用原始 SQL 获取 steps 数量
                count_result = await db.execute(
                    text("SELECT COUNT(*) FROM workflow_steps WHERE task_id = :task_id"),
                    {"task_id": str(task.id)}
                )
                steps_count = count_result.scalar() or 0
                task_infos.append(TemplateTaskInfo(
                    name=task.name,
                    steps_count=steps_count,
                ))
            
            items.append(TemplateResponse(
                id=t.id,
                name=t.name,
                description=t.description,
                cover_image_url=t.cover_image_url,
                tasks=task_infos,
            ))
        
        return TemplateListResponse(items=items)
    except Exception as e:
        import traceback
        print(f"Error in get_templates: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Get a single template by ID."""
    template = await template_service.get_template_by_id(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        cover_image_url=template.cover_image_url,
        tasks=[
            TemplateTaskInfo(
                name=task.name,
                steps_count=len(task.steps) if task.steps else 0,
            )
            for task in (template.tasks or [])
        ],
    )


@router.post("/{template_id}/create", response_model=WorkflowCreatedResponse)
async def create_from_template(
    template_id: UUID,
    data: CreateFromTemplateRequest,
    db: AsyncSession = Depends(get_async_db),
):
    """Create a new workflow from a template."""
    workflow = await template_service.create_workflow_from_template(
        db,
        template_id=template_id,
        name=data.name,
        description=data.description,
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return WorkflowCreatedResponse(
        id=workflow.id,
        name=workflow.name,
        description=workflow.description,
        status=workflow.status,
    )


@router.post("/init")
async def init_templates(
    db: AsyncSession = Depends(get_async_db),
):
    """Initialize preset templates (admin only)."""
    count = await template_service.init_preset_templates(db)
    return {
        "message": f"Initialized {count} templates",
        "count": count,
    }
