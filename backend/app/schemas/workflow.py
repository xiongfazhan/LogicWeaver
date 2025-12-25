"""Pydantic schemas for Workflow and related models."""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ============================================================================
# Enums as Literal types
# ============================================================================

WorkflowStatus = Literal["draft", "worker_done", "expert_done", "analyzed", "confirmed", "delivered", "deployed"]
StepStatus = Literal["pending", "completed"]
ContextType = Literal["image", "text", "voice"]
LogicStrategy = Literal["rule_based", "few_shot"]
ContentType = Literal["image", "text"]
ExampleLabel = Literal["PASS", "FAIL"]


# ============================================================================
# RoutingBranch Schemas
# ============================================================================


class RoutingBranchBase(BaseModel):
    """Base schema for RoutingBranch."""

    condition_result: str = Field(..., max_length=100)
    action_type: str = Field(..., max_length=100)
    next_step_id: str = Field(..., max_length=100)


class RoutingBranchCreate(RoutingBranchBase):
    """Schema for creating a RoutingBranch."""

    pass


class RoutingBranchUpdate(BaseModel):
    """Schema for updating a RoutingBranch."""

    condition_result: Optional[str] = Field(None, max_length=100)
    action_type: Optional[str] = Field(None, max_length=100)
    next_step_id: Optional[str] = Field(None, max_length=100)


class RoutingBranchResponse(RoutingBranchBase):
    """Schema for RoutingBranch response."""

    id: UUID
    step_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Example Schemas
# ============================================================================


class ExampleBase(BaseModel):
    """Base schema for Example."""

    content: str
    content_type: Optional[ContentType] = None
    label: ExampleLabel
    description: Optional[str] = None


class ExampleCreate(ExampleBase):
    """Schema for creating an Example."""

    pass


class ExampleUpdate(BaseModel):
    """Schema for updating an Example."""

    content: Optional[str] = None
    content_type: Optional[ContentType] = None
    label: Optional[ExampleLabel] = None
    description: Optional[str] = None


class ExampleResponse(ExampleBase):
    """Schema for Example response."""

    id: UUID
    step_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Context Data Schemas (Micro-Step A)
# ============================================================================


class ContextData(BaseModel):
    """Schema for Context micro-step data."""

    type: Optional[ContextType] = None
    image_url: Optional[str] = Field(None, max_length=500)
    text_content: Optional[str] = None
    voice_transcript: Optional[str] = None
    description: Optional[str] = None


# ============================================================================
# Extraction Data Schemas (Micro-Step B)
# ============================================================================


class ExtractionData(BaseModel):
    """Schema for Extraction micro-step data."""

    keywords: Optional[list[str]] = None
    voice_transcript: Optional[str] = None


# ============================================================================
# Logic Data Schemas (Micro-Step C)
# ============================================================================


class LogicData(BaseModel):
    """Schema for Logic micro-step data."""

    strategy: Optional[LogicStrategy] = None
    rule_expression: Optional[str] = None
    evaluation_prompt: Optional[str] = None


# ============================================================================
# Routing Data Schemas (Micro-Step D)
# ============================================================================


class RoutingData(BaseModel):
    """Schema for Routing micro-step data."""

    default_next: Optional[str] = Field(None, max_length=100)
    branches: Optional[list[RoutingBranchCreate]] = None


# ============================================================================
# WorkflowStep Schemas
# ============================================================================


class WorkflowStepBase(BaseModel):
    """Base schema for WorkflowStep."""

    name: str = Field(..., max_length=255)
    step_order: int = Field(..., ge=0)
    status: StepStatus = "pending"

    # Context (Micro-Step A)
    context_type: Optional[ContextType] = None
    context_image_url: Optional[str] = Field(None, max_length=500)
    context_text_content: Optional[str] = None
    context_voice_transcript: Optional[str] = None
    context_description: Optional[str] = None

    # Extraction (Micro-Step B)
    extraction_keywords: Optional[list[str]] = None
    extraction_voice_transcript: Optional[str] = None

    # Logic (Micro-Step C)
    logic_strategy: Optional[LogicStrategy] = None
    logic_rule_expression: Optional[str] = None
    logic_evaluation_prompt: Optional[str] = None

    # Routing (Micro-Step D)
    routing_default_next: Optional[str] = Field(None, max_length=100)


class WorkflowStepCreate(WorkflowStepBase):
    """Schema for creating a WorkflowStep."""

    pass


class WorkflowStepUpdate(BaseModel):
    """Schema for updating a WorkflowStep."""

    name: Optional[str] = Field(None, max_length=255)
    step_order: Optional[int] = Field(None, ge=0)
    status: Optional[StepStatus] = None

    # Context (Micro-Step A)
    context_type: Optional[ContextType] = None
    context_image_url: Optional[str] = Field(None, max_length=500)
    context_text_content: Optional[str] = None
    context_voice_transcript: Optional[str] = None
    context_description: Optional[str] = None

    # Extraction (Micro-Step B)
    extraction_keywords: Optional[list[str]] = None
    extraction_voice_transcript: Optional[str] = None

    # Logic (Micro-Step C)
    logic_strategy: Optional[LogicStrategy] = None
    logic_rule_expression: Optional[str] = None
    logic_evaluation_prompt: Optional[str] = None

    # Routing (Micro-Step D)
    routing_default_next: Optional[str] = Field(None, max_length=100)



class WorkflowStepResponse(WorkflowStepBase):
    """Schema for WorkflowStep response."""

    id: UUID
    workflow_id: UUID
    created_at: datetime
    updated_at: datetime

    # Related data
    examples: list[ExampleResponse] = []
    routing_branches: list[RoutingBranchResponse] = []

    model_config = ConfigDict(from_attributes=True)


class WorkflowStepSummary(BaseModel):
    """Summary schema for WorkflowStep (without nested relations)."""

    id: UUID
    workflow_id: UUID
    name: str
    step_order: int
    status: StepStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Workflow Schemas
# ============================================================================


class WorkflowBase(BaseModel):
    """Base schema for Workflow."""

    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    cover_image_url: Optional[str] = Field(None, max_length=500)
    status: WorkflowStatus = "draft"


class WorkflowCreate(WorkflowBase):
    """Schema for creating a Workflow."""

    pass


class WorkflowUpdate(BaseModel):
    """Schema for updating a Workflow."""

    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    cover_image_url: Optional[str] = Field(None, max_length=500)
    status: Optional[WorkflowStatus] = None


class WorkflowResponse(WorkflowBase):
    """Schema for Workflow response with steps."""

    id: UUID
    created_at: datetime
    updated_at: datetime
    steps: list[WorkflowStepResponse] = []

    model_config = ConfigDict(from_attributes=True)


class WorkflowSummary(WorkflowBase):
    """Summary schema for Workflow (without nested steps)."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkflowListResponse(BaseModel):
    """Schema for paginated workflow list response."""

    items: list[WorkflowSummary]
    total: int
    page: int
    page_size: int
