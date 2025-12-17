"""Workflow API endpoint tests."""

import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.routers.workflow import get_workflow_service
from app.schemas.workflow import WorkflowListResponse, WorkflowResponse, WorkflowSummary
from app.services.workflow import WorkflowNotFoundError


@pytest.fixture
def mock_workflow_service():
    """Create a mock workflow service."""
    return MagicMock()


@pytest.fixture
def client(mock_workflow_service):
    """Create a test client with mocked service."""
    app.dependency_overrides[get_workflow_service] = lambda: mock_workflow_service
    yield TestClient(app)
    app.dependency_overrides.clear()


def make_workflow_response(workflow_id=None, name="Test", **kwargs):
    """Helper to create a WorkflowResponse."""
    return WorkflowResponse(
        id=workflow_id or uuid4(),
        name=name,
        description=kwargs.get("description"),
        cover_image_url=kwargs.get("cover_image_url"),
        status=kwargs.get("status", "draft"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        steps=[],
    )


class TestListWorkflows:
    """Tests for GET /api/workflows endpoint."""

    def test_list_workflows_empty(self, client, mock_workflow_service):
        """Test listing workflows when none exist."""
        mock_workflow_service.list_workflows.return_value = WorkflowListResponse(
            items=[],
            total=0,
            page=1,
            page_size=20,
        )

        response = client.get("/api/workflows")

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0


    def test_list_workflows_with_pagination(self, client, mock_workflow_service):
        """Test listing workflows with pagination params."""
        mock_workflow_service.list_workflows.return_value = WorkflowListResponse(
            items=[],
            total=0,
            page=2,
            page_size=10,
        )

        response = client.get("/api/workflows?page=2&page_size=10")

        assert response.status_code == 200
        mock_workflow_service.list_workflows.assert_called_once_with(page=2, page_size=10)


class TestCreateWorkflow:
    """Tests for POST /api/workflows endpoint."""

    def test_create_workflow_success(self, client, mock_workflow_service):
        """Test creating a workflow successfully."""
        workflow_id = uuid4()
        mock_workflow_service.create_workflow.return_value = make_workflow_response(
            workflow_id=workflow_id,
            name="Test Workflow",
            description="Test description",
        )

        response = client.post(
            "/api/workflows",
            json={"name": "Test Workflow", "description": "Test description"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Workflow"

    def test_create_workflow_minimal(self, client, mock_workflow_service):
        """Test creating a workflow with minimal data."""
        workflow_id = uuid4()
        mock_workflow_service.create_workflow.return_value = make_workflow_response(
            workflow_id=workflow_id,
            name="Minimal",
        )

        response = client.post("/api/workflows", json={"name": "Minimal"})

        assert response.status_code == 201


class TestGetWorkflow:
    """Tests for GET /api/workflows/{id} endpoint."""

    def test_get_workflow_success(self, client, mock_workflow_service):
        """Test getting a workflow by ID."""
        workflow_id = uuid4()
        mock_workflow_service.get_workflow.return_value = make_workflow_response(
            workflow_id=workflow_id,
            name="Test",
        )

        response = client.get(f"/api/workflows/{workflow_id}")

        assert response.status_code == 200

    def test_get_workflow_not_found(self, client, mock_workflow_service):
        """Test getting a non-existent workflow."""
        workflow_id = uuid4()
        mock_workflow_service.get_workflow.side_effect = WorkflowNotFoundError(workflow_id)

        response = client.get(f"/api/workflows/{workflow_id}")

        assert response.status_code == 404



class TestUpdateWorkflow:
    """Tests for PUT /api/workflows/{id} endpoint."""

    def test_update_workflow_success(self, client, mock_workflow_service):
        """Test updating a workflow."""
        workflow_id = uuid4()
        mock_workflow_service.update_workflow.return_value = make_workflow_response(
            workflow_id=workflow_id,
            name="Updated Name",
            description="Updated desc",
        )

        response = client.put(
            f"/api/workflows/{workflow_id}",
            json={"name": "Updated Name", "description": "Updated desc"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"

    def test_update_workflow_not_found(self, client, mock_workflow_service):
        """Test updating a non-existent workflow."""
        workflow_id = uuid4()
        mock_workflow_service.update_workflow.side_effect = WorkflowNotFoundError(workflow_id)

        response = client.put(
            f"/api/workflows/{workflow_id}",
            json={"name": "New Name"},
        )

        assert response.status_code == 404


class TestDeleteWorkflow:
    """Tests for DELETE /api/workflows/{id} endpoint."""

    def test_delete_workflow_success(self, client, mock_workflow_service):
        """Test deleting a workflow."""
        workflow_id = uuid4()
        mock_workflow_service.delete_workflow.return_value = None

        response = client.delete(f"/api/workflows/{workflow_id}")

        assert response.status_code == 204

    def test_delete_workflow_not_found(self, client, mock_workflow_service):
        """Test deleting a non-existent workflow."""
        workflow_id = uuid4()
        mock_workflow_service.delete_workflow.side_effect = WorkflowNotFoundError(workflow_id)

        response = client.delete(f"/api/workflows/{workflow_id}")

        assert response.status_code == 404
