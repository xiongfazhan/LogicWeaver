"""Template service for managing workflow templates."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Workflow, Task, WorkflowStep


# 预置模板数据
PRESET_TEMPLATES = [
    {
        "name": "日常巡检",
        "description": "适用于设备巡检、安全检查等场景",
        "cover_image_url": None,
        "tasks": [
            {
                "name": "现场记录",
                "description": "拍照记录现场情况",
                "steps": [
                    {"name": "拍摄全景", "context_description": "拍摄现场全景照片"},
                    {"name": "拍摄细节", "context_description": "拍摄需要重点检查的部位"},
                ]
            },
            {
                "name": "数据采集",
                "description": "读取仪表数据",
                "steps": [
                    {"name": "读取仪表", "context_description": "读取仪表显示的数值"},
                    {"name": "记录异常", "context_description": "记录发现的异常情况"},
                ]
            },
            {
                "name": "结果填报",
                "description": "填写检查结果",
                "steps": [
                    {"name": "填写表格", "context_description": "将数据填入检查表格"},
                    {"name": "签字确认", "context_description": "检查完成后签字确认"},
                ]
            },
        ]
    },
    {
        "name": "质量检测",
        "description": "适用于产品质检、来料检验等场景",
        "cover_image_url": None,
        "tasks": [
            {
                "name": "外观检查",
                "description": "检查产品外观",
                "steps": [
                    {"name": "整体外观", "context_description": "检查产品整体外观是否完好"},
                    {"name": "表面瑕疵", "context_description": "检查表面是否有划痕、污渍等"},
                ]
            },
            {
                "name": "尺寸测量",
                "description": "测量产品尺寸",
                "steps": [
                    {"name": "使用工具测量", "context_description": "使用卡尺等工具测量尺寸"},
                    {"name": "记录数据", "context_description": "记录测量数据"},
                ]
            },
            {
                "name": "功能测试",
                "description": "测试产品功能",
                "steps": [
                    {"name": "通电测试", "context_description": "接通电源测试是否工作"},
                    {"name": "性能测试", "context_description": "测试各项性能指标"},
                ]
            },
        ]
    },
    {
        "name": "客服工单",
        "description": "适用于客户咨询、投诉处理等场景",
        "cover_image_url": None,
        "tasks": [
            {
                "name": "信息收集",
                "description": "收集客户信息和问题描述",
                "steps": [
                    {"name": "客户信息", "context_description": "记录客户姓名、联系方式"},
                    {"name": "问题描述", "context_description": "记录客户反映的问题"},
                ]
            },
            {
                "name": "问题分析",
                "description": "分析问题原因",
                "steps": [
                    {"name": "初步判断", "context_description": "根据描述初步判断问题类型"},
                    {"name": "查询历史", "context_description": "查询是否有类似问题记录"},
                ]
            },
            {
                "name": "解决处理",
                "description": "处理并反馈",
                "steps": [
                    {"name": "提供方案", "context_description": "向客户提供解决方案"},
                    {"name": "跟进确认", "context_description": "确认问题是否解决"},
                ]
            },
        ]
    },
]


async def get_templates(db: AsyncSession) -> List[Workflow]:
    """Get all workflow templates."""
    result = await db.execute(
        select(Workflow)
        .where(Workflow.is_template == True)
        .options(selectinload(Workflow.tasks))
        .order_by(Workflow.created_at)
    )
    return list(result.scalars().all())


async def get_template_by_id(db: AsyncSession, template_id: UUID) -> Optional[Workflow]:
    """Get a template by ID."""
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == template_id, Workflow.is_template == True)
        .options(selectinload(Workflow.tasks).selectinload(Task.steps))
    )
    return result.scalar_one_or_none()


async def create_workflow_from_template(
    db: AsyncSession,
    template_id: UUID,
    name: str,
    description: Optional[str] = None,
) -> Optional[Workflow]:
    """Create a new workflow from a template."""
    template = await get_template_by_id(db, template_id)
    if not template:
        return None
    
    # 创建新工作流
    workflow = Workflow(
        name=name,
        description=description or template.description,
        cover_image_url=template.cover_image_url,
        status="draft",
        is_template=False,
        template_id=template_id,
    )
    db.add(workflow)
    await db.flush()  # 获取 workflow.id
    
    # 复制任务和步骤
    step_order = 1
    for task in template.tasks:
        new_task = Task(
            workflow_id=workflow.id,
            name=task.name,
            task_order=task.task_order,
            description=task.description,
            status="pending",
        )
        db.add(new_task)
        await db.flush()
        
        for step in task.steps:
            new_step = WorkflowStep(
                workflow_id=workflow.id,
                task_id=new_task.id,
                name=step.name,
                step_order=step_order,
                status="pending",
                context_description=step.context_description,
            )
            db.add(new_step)
            step_order += 1
    
    await db.commit()
    await db.refresh(workflow)
    return workflow


async def init_preset_templates(db: AsyncSession) -> int:
    """Initialize preset templates if they don't exist."""
    # 检查是否已有模板
    existing = await get_templates(db)
    if existing:
        return 0
    
    created_count = 0
    for template_data in PRESET_TEMPLATES:
        # 创建模板工作流
        workflow = Workflow(
            name=template_data["name"],
            description=template_data["description"],
            cover_image_url=template_data["cover_image_url"],
            status="draft",
            is_template=True,
        )
        db.add(workflow)
        await db.flush()
        
        # 创建任务和步骤
        step_order = 1
        for task_order, task_data in enumerate(template_data["tasks"], start=1):
            task = Task(
                workflow_id=workflow.id,
                name=task_data["name"],
                task_order=task_order,
                description=task_data["description"],
                status="pending",
            )
            db.add(task)
            await db.flush()
            
            for step_data in task_data["steps"]:
                step = WorkflowStep(
                    workflow_id=workflow.id,
                    task_id=task.id,
                    name=step_data["name"],
                    step_order=step_order,
                    status="pending",
                    context_description=step_data["context_description"],
                )
                db.add(step)
                step_order += 1
        
        created_count += 1
    
    await db.commit()
    return created_count
