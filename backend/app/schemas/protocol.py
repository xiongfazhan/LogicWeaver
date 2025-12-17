"""Pydantic schemas for Protocol JSON output."""

from typing import Literal, Optional

from pydantic import BaseModel


# ============================================================================
# Protocol Logic Strategy (output format)
# ============================================================================

ProtocolLogicStrategy = Literal["RULE_BASED", "SEMANTIC_SIMILARITY"]


# ============================================================================
# Protocol Input Spec
# ============================================================================


class ProtocolInputSpec(BaseModel):
    """Input specification for a protocol step."""

    data_source: str
    target_section: str
    context_description: str


# ============================================================================
# Protocol Few-Shot Example
# ============================================================================


class ProtocolFewShotExample(BaseModel):
    """Few-shot example in protocol format."""

    content: str
    label: Literal["PASS", "FAIL"]
    description: str


# ============================================================================
# Protocol Logic Config
# ============================================================================


class ProtocolLogicConfig(BaseModel):
    """Logic configuration for a protocol step."""

    logic_strategy: ProtocolLogicStrategy
    rule_expression: Optional[str] = None
    few_shot_examples: Optional[list[ProtocolFewShotExample]] = None
    evaluation_prompt: Optional[str] = None


# ============================================================================
# Protocol Routing Branch
# ============================================================================


class ProtocolRoutingBranch(BaseModel):
    """Routing branch in protocol format."""

    condition_result: str
    action_type: str
    next_step_id: str


# ============================================================================
# Protocol Routing Map
# ============================================================================


class ProtocolRoutingMap(BaseModel):
    """Routing map for a protocol step."""

    default_next: str
    branches: list[ProtocolRoutingBranch] = []


# ============================================================================
# Protocol Output Schema Field
# ============================================================================


class ProtocolOutputField(BaseModel):
    """Output field definition."""

    name: str
    type: str


# ============================================================================
# Protocol Output Schema
# ============================================================================


class ProtocolOutputSchema(BaseModel):
    """Output schema for a protocol step."""

    fields: list[ProtocolOutputField] = []


# ============================================================================
# Protocol Step
# ============================================================================


class ProtocolStep(BaseModel):
    """Complete protocol step definition."""

    step_id: str
    step_name: str
    business_domain: str

    input_spec: ProtocolInputSpec
    logic_config: ProtocolLogicConfig
    routing_map: ProtocolRoutingMap
    output_schema: ProtocolOutputSchema


# ============================================================================
# Protocol Workflow
# ============================================================================


class ProtocolWorkflow(BaseModel):
    """Complete protocol workflow definition."""

    workflow_id: str
    workflow_name: str
    steps: list[ProtocolStep] = []
