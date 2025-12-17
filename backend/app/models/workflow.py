"""Workflow and related SQLAlchemy models."""

from sqlalchemy import (
    ARRAY,
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
    status = Column(String(20), default="draft", nullable=False)

    # Relationships
    steps = relationship(
        "WorkflowStep",
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.step_order",
    )

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'deployed')", name="ck_workflow_status"),
    )


class WorkflowStep(Base, UUIDMixin, TimestampMixin):
    """WorkflowStep model representing a single step in a workflow."""

    __tablename__ = "workflow_steps"

    workflow_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    step_order = Column(Integer, nullable=False)
    status = Column(String(20), default="pending", nullable=False)

    # Context (Micro-Step A)
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

    # Relationships
    workflow = relationship("Workflow", back_populates="steps")
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
