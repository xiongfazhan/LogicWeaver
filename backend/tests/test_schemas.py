"""Tests for Pydantic schemas."""

import pytest
from uuid import uuid4
from datetime import datetime

from app.schemas import (
    WorkflowCreate,
    WorkflowResponse,
    WorkflowUpdate,
    WorkflowStepCreate,
    WorkflowStepResponse,
    ExampleCreate,
    ExampleResponse,
    RoutingBranchCreate,
    RoutingBranchResponse,
    ProtocolWorkflow,
    ProtocolStep,
    ProtocolInputSpec,
    ProtocolLogicConfig,
    ProtocolRoutingMap,
    ProtocolOutputSchema,
)


class TestWorkflowSchemas:
    """Tests for Workflow schemas."""

    def test_workflow_create_minimal(self):
        """Test creating a workflow with minimal data."""
        workflow = WorkflowCreate(name="Test Workflow")
        assert workflow.name == "Test Workflow"
        assert workflow.status == "draft"
        assert workflow.description is None

    def test_workflow_create_full(self):
        """Test creating a workflow with all fields."""
        workflow = WorkflowCreate(
            name="Full Workflow",
            description="A complete workflow",
            cover_image_url="/uploads/cover.jpg",
            status="deployed",
        )
        assert workflow.name == "Full Workflow"
        assert workflow.description == "A complete workflow"
        assert workflow.status == "deployed"

    def test_workflow_update_partial(self):
        """Test partial workflow update."""
        update = WorkflowUpdate(name="Updated Name")
        assert update.name == "Updated Name"
        assert update.description is None


class TestWorkflowStepSchemas:
    """Tests for WorkflowStep schemas."""

    def test_step_create_minimal(self):
        """Test creating a step with minimal data."""
        step = WorkflowStepCreate(name="Step 1", step_order=0)
        assert step.name == "Step 1"
        assert step.step_order == 0
        assert step.status == "pending"

    def test_step_create_with_context(self):
        """Test creating a step with context data."""
        step = WorkflowStepCreate(
            name="Context Step",
            step_order=1,
            context_type="image",
            context_image_url="/uploads/context.jpg",
            context_description="Check this area",
        )
        assert step.context_type == "image"
        assert step.context_image_url == "/uploads/context.jpg"

    def test_step_create_with_logic(self):
        """Test creating a step with logic data."""
        step = WorkflowStepCreate(
            name="Logic Step",
            step_order=2,
            logic_strategy="few_shot",
            logic_evaluation_prompt="Evaluate based on examples",
        )
        assert step.logic_strategy == "few_shot"


class TestExampleSchemas:
    """Tests for Example schemas."""

    def test_example_create_pass(self):
        """Test creating a passing example."""
        example = ExampleCreate(
            content="/uploads/pass_example.jpg",
            content_type="image",
            label="PASS",
            description="This is a good example",
        )
        assert example.label == "PASS"
        assert example.content_type == "image"

    def test_example_create_fail(self):
        """Test creating a failing example."""
        example = ExampleCreate(
            content="This text fails the check",
            content_type="text",
            label="FAIL",
        )
        assert example.label == "FAIL"


class TestRoutingBranchSchemas:
    """Tests for RoutingBranch schemas."""

    def test_routing_branch_create(self):
        """Test creating a routing branch."""
        branch = RoutingBranchCreate(
            condition_result="FAIL",
            action_type="REJECT",
            next_step_id="end_process",
        )
        assert branch.condition_result == "FAIL"
        assert branch.action_type == "REJECT"


class TestProtocolSchemas:
    """Tests for Protocol schemas."""

    def test_protocol_workflow_creation(self):
        """Test creating a complete protocol workflow."""
        protocol = ProtocolWorkflow(
            workflow_id=str(uuid4()),
            workflow_name="Test Protocol",
            steps=[
                ProtocolStep(
                    step_id=str(uuid4()),
                    step_name="Step 1",
                    business_domain="quality_check",
                    input_spec=ProtocolInputSpec(
                        data_source="document",
                        target_section="header",
                        context_description="Check the header area",
                    ),
                    logic_config=ProtocolLogicConfig(
                        logic_strategy="SEMANTIC_SIMILARITY",
                        evaluation_prompt="Evaluate similarity",
                    ),
                    routing_map=ProtocolRoutingMap(
                        default_next="step_2",
                        branches=[],
                    ),
                    output_schema=ProtocolOutputSchema(fields=[]),
                )
            ],
        )
        assert protocol.workflow_name == "Test Protocol"
        assert len(protocol.steps) == 1
        assert protocol.steps[0].logic_config.logic_strategy == "SEMANTIC_SIMILARITY"
