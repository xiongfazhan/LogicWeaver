"""Status flow service for workflow state transitions."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Workflow


# 状态流转规则
# draft -> worker_done -> expert_done -> analyzed -> confirmed -> delivered
VALID_TRANSITIONS = {
    "draft": ["worker_done"],
    "worker_done": ["draft", "expert_done"],
    "expert_done": ["worker_done", "analyzed"],
    "analyzed": ["expert_done", "confirmed"],
    "confirmed": ["analyzed", "delivered"],
    "delivered": ["confirmed"],
}

# 状态显示名称
STATUS_LABELS = {
    "draft": "草稿",
    "worker_done": "待专家整理",
    "expert_done": "待AI分析",
    "analyzed": "待复核",
    "confirmed": "已确认",
    "delivered": "已交付",
}

# 状态颜色
STATUS_COLORS = {
    "draft": "slate",
    "worker_done": "amber",
    "expert_done": "blue",
    "analyzed": "purple",
    "confirmed": "emerald",
    "delivered": "green",
}


async def get_workflow_status(
    db: AsyncSession,
    workflow_id: UUID,
) -> Optional[dict]:
    """Get workflow status info."""
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        return None
    
    return {
        "id": workflow.id,
        "status": workflow.status,
        "label": STATUS_LABELS.get(workflow.status, workflow.status),
        "color": STATUS_COLORS.get(workflow.status, "slate"),
        "allowed_transitions": VALID_TRANSITIONS.get(workflow.status, []),
    }


async def transition_workflow_status(
    db: AsyncSession,
    workflow_id: UUID,
    new_status: str,
) -> Optional[dict]:
    """Transition workflow to a new status."""
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        return None
    
    # 检查是否允许的状态转换
    allowed = VALID_TRANSITIONS.get(workflow.status, [])
    if new_status not in allowed:
        return {
            "success": False,
            "error": f"不允许从 {STATUS_LABELS.get(workflow.status)} 转换到 {STATUS_LABELS.get(new_status)}",
            "allowed_transitions": allowed,
        }
    
    # 更新状态
    workflow.status = new_status
    await db.commit()
    await db.refresh(workflow)
    
    return {
        "success": True,
        "id": workflow.id,
        "status": workflow.status,
        "label": STATUS_LABELS.get(workflow.status, workflow.status),
        "color": STATUS_COLORS.get(workflow.status, "slate"),
        "allowed_transitions": VALID_TRANSITIONS.get(workflow.status, []),
    }


async def advance_workflow_status(
    db: AsyncSession,
    workflow_id: UUID,
) -> Optional[dict]:
    """Advance workflow to the next status in the flow."""
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        return None
    
    # 获取下一个状态（只取前进方向的）
    current = workflow.status
    next_status_map = {
        "draft": "worker_done",
        "worker_done": "expert_done",
        "expert_done": "analyzed",
        "analyzed": "confirmed",
        "confirmed": "delivered",
    }
    
    next_status = next_status_map.get(current)
    if not next_status:
        return {
            "success": False,
            "error": "已是最终状态",
            "status": current,
        }
    
    # 更新状态
    workflow.status = next_status
    await db.commit()
    await db.refresh(workflow)
    
    return {
        "success": True,
        "id": workflow.id,
        "previous_status": current,
        "status": workflow.status,
        "label": STATUS_LABELS.get(workflow.status, workflow.status),
        "color": STATUS_COLORS.get(workflow.status, "slate"),
    }


async def rollback_workflow_status(
    db: AsyncSession,
    workflow_id: UUID,
) -> Optional[dict]:
    """Rollback workflow to the previous status."""
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        return None
    
    # 获取上一个状态
    current = workflow.status
    prev_status_map = {
        "worker_done": "draft",
        "expert_done": "worker_done",
        "analyzed": "expert_done",
        "confirmed": "analyzed",
        "delivered": "confirmed",
    }
    
    prev_status = prev_status_map.get(current)
    if not prev_status:
        return {
            "success": False,
            "error": "已是初始状态",
            "status": current,
        }
    
    # 更新状态
    workflow.status = prev_status
    await db.commit()
    await db.refresh(workflow)
    
    return {
        "success": True,
        "id": workflow.id,
        "previous_status": current,
        "status": workflow.status,
        "label": STATUS_LABELS.get(workflow.status, workflow.status),
        "color": STATUS_COLORS.get(workflow.status, "slate"),
    }
