"""Protocol API endpoint tests."""

from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.database import get_db
from app.main import app
from app.schemas.protocol import (
    ProtocolFewShotExample,
    ProtocolInputSpec,
    ProtocolLogicConfig,
    ProtocolOutputField,
    ProtocolOutputSchema,
    ProtocolRoutingBranch,
    ProtocolRoutingMap,
    ProtocolStep,
    ProtocolWorkflow,
)
from app.services.protocol import ProtocolService, WorkflowNotFoundError


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return MagicMock()


@pytest.fixture
def mock_protocol_service():
    """Create a mock protocol service."""
    return MagicMock(spec=ProtocolService)


@pytest.fixture
def client(mock_db, mock_protocol_service):
    """Create a test client with mocked dependencies."""
    # Override the database dependency
    app.dependency_overrides[get_db] = lambda: mock_db
    
    # We need to patch the ProtocolService instantiation
    original_init = ProtocolService.__init__
    
    def mock_init(self, db):
        pass
    
    ProtocolService.__init__ = mock_init
    ProtocolService.generate_protocol = mock_protocol_service.generate_protocol
    
    yield TestClient(app)
    
    # Restore
    ProtocolService.__init__ = original_init
    app.dependency_overrides.clear()


def make_protocol_step(step_id=None, step_name="Test Step", **kwargs):
    """Helper to create a ProtocolStep."""
    return ProtocolStep(
        step_id=step_id or str(uuid4()),
        step_name=step_name,
        business_domain=kwargs.get("business_domain", "general"),
        input_spec=kwargs.get("input_spec", ProtocolInputSpec(
            data_source="image",
            target_section="test section",
            context_description="test description",
        )),
        logic_config=kwargs.get("logic_config", ProtocolLogicConfig(
            logic_strategy="RULE_BASED",
            rule_expression="amount > 5000",
        )),
        routing_map=kwargs.get("routing_map", ProtocolRoutingMap(
            default_next="next",
            branches=[],
        )),
        output_schema=kwargs.get("output_schema", ProtocolOutputSchema(
            fields=[ProtocolOutputField(name="judgment_result", type="string")],
        )),
    )


def make_protocol_workflow(workflow_id=None, workflow_name="Test Workflow", steps=None):
    """Helper to create a ProtocolWorkflow."""
    return ProtocolWorkflow(
        workflow_id=workflow_id or str(uuid4()),
        workflow_name=workflow_name,
        steps=steps or [],
    )


class TestGetProtocol:
    """Tests for GET /api/protocol/{workflow_id} endpoint."""

    def test_get_protocol_empty_workflow(self, client, mock_protocol_service):
        """Test getting protocol for a workflow with no steps."""
        workflow_id = uuid4()
        mock_protocol_service.generate_protocol.return_value = make_protocol_workflow(
            workflow_id=str(workflow_id),
            workflow_name="Empty Workflow",
            steps=[],
        )

        response = client.get(f"/api/protocol/{workflow_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["workflow_id"] == str(workflow_id)
        assert data["workflow_name"] == "Empty Workflow"
        assert data["steps"] == []

    def test_get_protocol_with_steps(self, client, mock_protocol_service):
        """Test getting protocol for a workflow with steps."""
        workflow_id = uuid4()
        step = make_protocol_step(step_name="Step 1")
        mock_protocol_service.generate_protocol.return_value = make_protocol_workflow(
            workflow_id=str(workflow_id),
            workflow_name="Test Workflow",
            steps=[step],
        )

        response = client.get(f"/api/protocol/{workflow_id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data["steps"]) == 1
        assert data["steps"][0]["step_name"] == "Step 1"

    def test_get_protocol_with_few_shot(self, client, mock_protocol_service):
        """Test getting protocol with few-shot logic configuration."""
        workflow_id = uuid4()
        step = make_protocol_step(
            step_name="Few-Shot Step",
            logic_config=ProtocolLogicConfig(
                logic_strategy="SEMANTIC_SIMILARITY",
                few_shot_examples=[
                    ProtocolFewShotExample(
                        content="example1.jpg",
                        label="PASS",
                        description="Good example",
                    ),
                    ProtocolFewShotExample(
                        content="example2.jpg",
                        label="FAIL",
                        description="Bad example",
                    ),
                ],
                evaluation_prompt="Evaluate based on examples",
            ),
        )
        mock_protocol_service.generate_protocol.return_value = make_protocol_workflow(
            workflow_id=str(workflow_id),
            steps=[step],
        )

        response = client.get(f"/api/protocol/{workflow_id}")

        assert response.status_code == 200
        data = response.json()
        logic_config = data["steps"][0]["logic_config"]
        assert logic_config["logic_strategy"] == "SEMANTIC_SIMILARITY"
        assert len(logic_config["few_shot_examples"]) == 2
        assert logic_config["few_shot_examples"][0]["label"] == "PASS"
        assert logic_config["few_shot_examples"][1]["label"] == "FAIL"

    def test_get_protocol_with_routing_branches(self, client, mock_protocol_service):
        """Test getting protocol with routing branches."""
        workflow_id = uuid4()
        step = make_protocol_step(
            step_name="Routing Step",
            routing_map=ProtocolRoutingMap(
                default_next="step_2",
                branches=[
                    ProtocolRoutingBranch(
                        condition_result="FAIL",
                        action_type="REJECT",
                        next_step_id="end_process",
                    ),
                    ProtocolRoutingBranch(
                        condition_result="UNSTABLE",
                        action_type="ESCALATE",
                        next_step_id="manual_review",
                    ),
                ],
            ),
        )
        mock_protocol_service.generate_protocol.return_value = make_protocol_workflow(
            workflow_id=str(workflow_id),
            steps=[step],
        )

        response = client.get(f"/api/protocol/{workflow_id}")

        assert response.status_code == 200
        data = response.json()
        routing_map = data["steps"][0]["routing_map"]
        assert routing_map["default_next"] == "step_2"
        assert len(routing_map["branches"]) == 2
        assert routing_map["branches"][0]["condition_result"] == "FAIL"
        assert routing_map["branches"][0]["action_type"] == "REJECT"

    def test_get_protocol_not_found(self, client, mock_protocol_service):
        """Test getting protocol for a non-existent workflow."""
        workflow_id = uuid4()
        mock_protocol_service.generate_protocol.side_effect = WorkflowNotFoundError(workflow_id)

        response = client.get(f"/api/protocol/{workflow_id}")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_protocol_invalid_uuid(self, client):
        """Test getting protocol with invalid UUID."""
        response = client.get("/api/protocol/invalid-uuid")

        assert response.status_code == 422  # Validation error
