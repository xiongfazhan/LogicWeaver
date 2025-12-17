"""Step API endpoint tests."""

from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers.step import get_step_service
from app.schemas.workflow import WorkflowStepResponse
from app.services.step import (
    StepNotFoundError,
    StepOrderConflictError,
    WorkflowNotFoundError,
)


@pytest.fixture
def mock_step_service():
    """Create a mock step service."""
    return MagicMock()


@pytest.fixture
def client(mock_step_service):
    """Create a test client with mocked service."""
    app.dependency_overrides[get_step_service] = lambda: mock_step_service
    yield TestClient(app)
    app.dependency_overrides.clear()


def make_step_response(step_id=None, workflow_id=None, name="Test Step", **kwargs):
    """Helper to create a WorkflowStepResponse."""
    return WorkflowStepResponse(
        id=step_id or uuid4(),
        workflow_id=workflow_id or uuid4(),
        name=name,
        step_order=kwargs.get("step_order", 0),
        status=kwargs.get("status", "pending"),
        context_type=kwargs.get("context_type"),
        context_image_url=kwargs.get("context_image_url"),
        context_text_content=kwargs.get("context_text_content"),
        context_voice_transcript=kwargs.get("context_voice_transcript"),
        context_description=kwargs.get("context_description"),
        extraction_keywords=kwargs.get("extraction_keywords"),
        extraction_voice_transcript=kwargs.get("extraction_voice_transcript"),
        logic_strategy=kwargs.get("logic_strategy"),
        logic_rule_expression=kwargs.get("logic_rule_expression"),
        logic_evaluation_prompt=kwargs.get("logic_evaluation_prompt"),
        routing_default_next=kwargs.get("routing_default_next"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        examples=[],
        routing_branches=[],
    )



class TestListSteps:
    """Tests for GET /api/workflows/{id}/steps endpoint."""

    def test_list_steps_empty(self, client, mock_step_service):
        """Test listing steps when none exist."""
        workflow_id = uuid4()
        mock_step_service.list_steps.return_value = []

        response = client.get(f"/api/workflows/{workflow_id}/steps")

        assert response.status_code == 200
        assert response.json() == []

    def test_list_steps_with_data(self, client, mock_step_service):
        """Test listing steps with data."""
        workflow_id = uuid4()
        step1 = make_step_response(workflow_id=workflow_id, name="Step 1", step_order=0)
        step2 = make_step_response(workflow_id=workflow_id, name="Step 2", step_order=1)
        mock_step_service.list_steps.return_value = [step1, step2]

        response = client.get(f"/api/workflows/{workflow_id}/steps")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "Step 1"
        assert data[1]["name"] == "Step 2"

    def test_list_steps_workflow_not_found(self, client, mock_step_service):
        """Test listing steps for non-existent workflow."""
        workflow_id = uuid4()
        mock_step_service.list_steps.side_effect = WorkflowNotFoundError(workflow_id)

        response = client.get(f"/api/workflows/{workflow_id}/steps")

        assert response.status_code == 404


class TestCreateStep:
    """Tests for POST /api/workflows/{id}/steps endpoint."""

    def test_create_step_success(self, client, mock_step_service):
        """Test creating a step successfully."""
        workflow_id = uuid4()
        step_id = uuid4()
        mock_step_service.create_step.return_value = make_step_response(
            step_id=step_id,
            workflow_id=workflow_id,
            name="New Step",
            step_order=0,
        )

        response = client.post(
            f"/api/workflows/{workflow_id}/steps",
            json={"name": "New Step", "step_order": 0},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Step"

    def test_create_step_auto_order(self, client, mock_step_service):
        """Test creating a step with auto order."""
        workflow_id = uuid4()
        step_id = uuid4()
        mock_step_service.create_step_auto_order.return_value = make_step_response(
            step_id=step_id,
            workflow_id=workflow_id,
            name="Auto Step",
            step_order=5,
        )

        response = client.post(
            f"/api/workflows/{workflow_id}/steps?auto_order=true",
            json={"name": "Auto Step", "step_order": 0},
        )

        assert response.status_code == 201
        mock_step_service.create_step_auto_order.assert_called_once()

    def test_create_step_workflow_not_found(self, client, mock_step_service):
        """Test creating step in non-existent workflow."""
        workflow_id = uuid4()
        mock_step_service.create_step.side_effect = WorkflowNotFoundError(workflow_id)

        response = client.post(
            f"/api/workflows/{workflow_id}/steps",
            json={"name": "New Step", "step_order": 0},
        )

        assert response.status_code == 404

    def test_create_step_order_conflict(self, client, mock_step_service):
        """Test creating step with conflicting order."""
        workflow_id = uuid4()
        mock_step_service.create_step.side_effect = StepOrderConflictError(
            workflow_id, 0
        )

        response = client.post(
            f"/api/workflows/{workflow_id}/steps",
            json={"name": "New Step", "step_order": 0},
        )

        assert response.status_code == 409



class TestGetStep:
    """Tests for GET /api/workflows/{id}/steps/{step_id} endpoint."""

    def test_get_step_success(self, client, mock_step_service):
        """Test getting a step by ID."""
        workflow_id = uuid4()
        step_id = uuid4()
        mock_step_service.get_step.return_value = make_step_response(
            step_id=step_id,
            workflow_id=workflow_id,
            name="Test Step",
        )

        response = client.get(f"/api/workflows/{workflow_id}/steps/{step_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Step"

    def test_get_step_not_found(self, client, mock_step_service):
        """Test getting a non-existent step."""
        workflow_id = uuid4()
        step_id = uuid4()
        mock_step_service.get_step.side_effect = StepNotFoundError(step_id)

        response = client.get(f"/api/workflows/{workflow_id}/steps/{step_id}")

        assert response.status_code == 404

    def test_get_step_wrong_workflow(self, client, mock_step_service):
        """Test getting a step from wrong workflow."""
        workflow_id = uuid4()
        other_workflow_id = uuid4()
        step_id = uuid4()
        mock_step_service.get_step.return_value = make_step_response(
            step_id=step_id,
            workflow_id=other_workflow_id,
            name="Test Step",
        )

        response = client.get(f"/api/workflows/{workflow_id}/steps/{step_id}")

        assert response.status_code == 404


class TestUpdateStep:
    """Tests for PUT /api/workflows/{id}/steps/{step_id} endpoint."""

    def test_update_step_success(self, client, mock_step_service):
        """Test updating a step."""
        workflow_id = uuid4()
        step_id = uuid4()
        mock_step_service.get_step.return_value = make_step_response(
            step_id=step_id,
            workflow_id=workflow_id,
            name="Old Name",
        )
        mock_step_service.update_step.return_value = make_step_response(
            step_id=step_id,
            workflow_id=workflow_id,
            name="New Name",
        )

        response = client.put(
            f"/api/workflows/{workflow_id}/steps/{step_id}",
            json={"name": "New Name"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"

    def test_update_step_not_found(self, client, mock_step_service):
        """Test updating a non-existent step."""
        workflow_id = uuid4()
        step_id = uuid4()
        mock_step_service.get_step.side_effect = StepNotFoundError(step_id)

        response = client.put(
            f"/api/workflows/{workflow_id}/steps/{step_id}",
            json={"name": "New Name"},
        )

        assert response.status_code == 404


class TestDeleteStep:
    """Tests for DELETE /api/workflows/{id}/steps/{step_id} endpoint."""

    def test_delete_step_success(self, client, mock_step_service):
        """Test deleting a step."""
        workflow_id = uuid4()
        step_id = uuid4()
        mock_step_service.get_step.return_value = make_step_response(
            step_id=step_id,
            workflow_id=workflow_id,
        )
        mock_step_service.delete_step.return_value = None

        response = client.delete(f"/api/workflows/{workflow_id}/steps/{step_id}")

        assert response.status_code == 204

    def test_delete_step_not_found(self, client, mock_step_service):
        """Test deleting a non-existent step."""
        workflow_id = uuid4()
        step_id = uuid4()
        mock_step_service.get_step.side_effect = StepNotFoundError(step_id)

        response = client.delete(f"/api/workflows/{workflow_id}/steps/{step_id}")

        assert response.status_code == 404


class TestRoutingBranches:
    """Tests for routing branch endpoints."""

    def test_add_routing_branch_success(self, client, mock_step_service):
        """Test adding a routing branch."""
        workflow_id = uuid4()
        step_id = uuid4()
        mock_step_service.get_step.return_value = make_step_response(
            step_id=step_id,
            workflow_id=workflow_id,
        )
        mock_step_service.add_routing_branch.return_value = make_step_response(
            step_id=step_id,
            workflow_id=workflow_id,
        )

        response = client.post(
            f"/api/workflows/{workflow_id}/steps/{step_id}/branches",
            json={
                "condition_result": "FAIL",
                "action_type": "REJECT",
                "next_step_id": "end_process",
            },
        )

        assert response.status_code == 201

    def test_remove_routing_branch_success(self, client, mock_step_service):
        """Test removing a routing branch."""
        workflow_id = uuid4()
        step_id = uuid4()
        branch_id = uuid4()
        mock_step_service.get_step.return_value = make_step_response(
            step_id=step_id,
            workflow_id=workflow_id,
        )
        mock_step_service.remove_routing_branch.return_value = make_step_response(
            step_id=step_id,
            workflow_id=workflow_id,
        )

        response = client.delete(
            f"/api/workflows/{workflow_id}/steps/{step_id}/branches/{branch_id}"
        )

        assert response.status_code == 200
