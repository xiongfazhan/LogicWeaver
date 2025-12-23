"""Workflow and related SQLAlchemy models."""

from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Workflow(Base, UUIDMixin, TimestampMixin):
    """Workflow model representing a complete SOP workflow."""

    __tablename__ = "workflows"

    name = Column(String(255), nullable=False)
    description = Column(Text)
    cover_image_url = Column(String(500))
    # 状态：draft(草稿) -> worker_done(工人完成) -> expert_done(专家完成) 
    #       -> analyzed(已分析) -> confirmed(已确认) -> delivered(已交付)
    status = Column(String(20), default="draft", nullable=False)
    # 是否为模板
    is_template = Column(Boolean, default=False)
    # 从哪个模板创建的
    template_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=True)

    # Relationships
    tasks = relationship(
        "Task",
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="Task.task_order",
    )
    # 保留旧的 steps 关系以兼容
    steps = relationship(
        "WorkflowStep",
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.step_order",
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'worker_done', 'expert_done', 'analyzed', 'confirmed', 'delivered')", 
            name="ck_workflow_status"
        ),
    )


class Task(Base, UUIDMixin, TimestampMixin):
    """Task model representing a group of steps (二级：任务)."""

    __tablename__ = "tasks"

    workflow_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)  # 如 "抄表"
    task_order = Column(Integer, nullable=False)  # 1, 2, 3...
    description = Column(Text)  # 专家填写的详细说明
    status = Column(String(20), default="pending", nullable=False)

    # Relationships
    workflow = relationship("Workflow", back_populates="tasks")
    steps = relationship(
        "WorkflowStep",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.step_order",
    )

    __table_args__ = (
        UniqueConstraint("workflow_id", "task_order", name="uq_workflow_task_order"),
        CheckConstraint(
            "status IN ('pending', 'completed')", name="ck_task_status"
        ),
    )


class WorkflowStep(Base, UUIDMixin, TimestampMixin):
    """WorkflowStep model representing a single step in a task."""

    __tablename__ = "workflow_steps"

    workflow_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
    )
    # 新增：关联到 Task
    task_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=True,  # 允许为空，兼容旧数据
    )
    name = Column(String(255), nullable=False)
    step_order = Column(Integer, nullable=False)
    status = Column(String(20), default="pending", nullable=False)

    # Context (Micro-Step A) - 工人填写
    context_type = Column(String(20))
    context_image_url = Column(String(500))
    context_text_content = Column(Text)
    context_voice_transcript = Column(Text)
    context_description = Column(Text)

    # Extraction (Micro-Step B)
    extraction_keywords = Column(ARRAY(Text))
    extraction_voice_transcript = Column(Text)

    # Logic (Micro-Step C)
    logic_strategy = Column(String(20))
    logic_rule_expression = Column(Text)
    logic_evaluation_prompt = Column(Text)

    # Routing (Micro-Step D)
    routing_default_next = Column(String(100))
    
    # 专家整理的内容
    expert_notes = Column(Text)

    # Relationships
    workflow = relationship("Workflow", back_populates="steps")
    task = relationship("Task", back_populates="steps")
    examples = relationship(
        "Example",
        back_populates="step",
        cascade="all, delete-orphan",
    )
    routing_branches = relationship(
        "RoutingBranch",
        back_populates="step",
        cascade="all, delete-orphan",
    )
    notes = relationship(
        "StepNote",
        back_populates="step",
        cascade="all, delete-orphan",
        order_by="StepNote.created_at",
    )

    __table_args__ = (
        UniqueConstraint("workflow_id", "step_order", name="uq_workflow_step_order"),
        CheckConstraint(
            "status IN ('pending', 'completed')", name="ck_step_status"
        ),
        CheckConstraint(
            "context_type IS NULL OR context_type IN ('image', 'text', 'voice')",
            name="ck_context_type",
        ),
        CheckConstraint(
            "logic_strategy IS NULL OR logic_strategy IN ('rule_based', 'few_shot')",
            name="ck_logic_strategy",
        ),
    )


class StepNote(Base, UUIDMixin, TimestampMixin):
    """StepNote model for media attachments (三级：笔记/素材)."""

    __tablename__ = "step_notes"

    step_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflow_steps.id", ondelete="CASCADE"),
        nullable=False,
    )
    # 内容类型：image/voice/video/text
    content_type = Column(String(20), nullable=False)
    # 内容：URL（图片/语音/视频）或文本内容
    content = Column(Text, nullable=False)
    # 语音转文字结果（占位）
    voice_transcript = Column(Text)
    # 创建者：worker/expert
    created_by = Column(String(20), default="worker")

    # Relationships
    step = relationship("WorkflowStep", back_populates="notes")

    __table_args__ = (
        CheckConstraint(
            "content_type IN ('image', 'voice', 'video', 'text')",
            name="ck_note_content_type",
        ),
        CheckConstraint(
            "created_by IN ('worker', 'expert')",
            name="ck_note_created_by",
        ),
    )


class Example(Base, UUIDMixin, TimestampMixin):
    """Example model for Few-Shot learning samples."""

    __tablename__ = "examples"

    step_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflow_steps.id", ondelete="CASCADE"),
        nullable=False,
    )
    content = Column(Text, nullable=False)
    content_type = Column(String(20))
    label = Column(String(10), nullable=False)
    description = Column(Text)

    # Relationships
    step = relationship("WorkflowStep", back_populates="examples")

    __table_args__ = (
        CheckConstraint(
            "content_type IS NULL OR content_type IN ('image', 'text')",
            name="ck_example_content_type",
        ),
        CheckConstraint("label IN ('PASS', 'FAIL')", name="ck_example_label"),
    )


class RoutingBranch(Base, UUIDMixin, TimestampMixin):
    """RoutingBranch model for conditional workflow routing."""

    __tablename__ = "routing_branches"

    step_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflow_steps.id", ondelete="CASCADE"),
        nullable=False,
    )
    condition_result = Column(String(100), nullable=False)
    action_type = Column(String(100), nullable=False)
    next_step_id = Column(String(100), nullable=False)

    # Relationships
    step = relationship("WorkflowStep", back_populates="routing_branches")

