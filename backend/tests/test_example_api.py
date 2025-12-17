"""Example API endpoint tests."""

from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers.example import get_example_service
from app.schemas.workflow import ExampleResponse
from app.services.example import (
    ExampleNotFoundError,
    StepNotFoundError,
)


@pytest.fixture
def mock_example_service():
    """Create a mock example service."""
    return MagicMock()


@pytest.fixture
def client(mock_example_service):
    """Create a test client with mocked service."""
    app.dependency_overrides[get_example_service] = lambda: mock_example_service
    yield TestClient(app)
    app.dependency_overrides.clear()


def make_example_response(example_id=None, step_id=None, **kwargs):
    """Helper to create an ExampleResponse."""
    return ExampleResponse(
        id=example_id or uuid4(),
        step_id=step_id or uuid4(),
        content=kwargs.get("content", "test content"),
        content_type=kwargs.get("content_type", "text"),
        label=kwargs.get("label", "PASS"),
        description=kwargs.get("description"),
        created_at=datetime.now(timezone.utc),
    )


class TestListExamples:
    """Tests for GET /api/steps/{step_id}/examples endpoint."""

    def test_list_examples_empty(self, client, mock_example_service):
        """Test listing examples when none exist."""
        step_id = uuid4()
        mock_example_service.list_examples_by_step.return_value = []

        response = client.get(f"/api/steps/{step_id}/examples")

        assert response.status_code == 200
        assert response.json() == []


    def test_list_examples_with_data(self, client, mock_example_service):
        """Test listing examples with data."""
        step_id = uuid4()
        ex1 = make_example_response(step_id=step_id, label="PASS", content="pass1")
        ex2 = make_example_response(step_id=step_id, label="FAIL", content="fail1")
        mock_example_service.list_examples_by_step.return_value = [ex1, ex2]

        response = client.get(f"/api/steps/{step_id}/examples")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_list_examples_filter_pass(self, client, mock_example_service):
        """Test listing only passing examples."""
        step_id = uuid4()
        ex1 = make_example_response(step_id=step_id, label="PASS", content="pass1")
        mock_example_service.list_passing_examples.return_value = [ex1]

        response = client.get(f"/api/steps/{step_id}/examples?label=PASS")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["label"] == "PASS"
        mock_example_service.list_passing_examples.assert_called_once()

    def test_list_examples_filter_fail(self, client, mock_example_service):
        """Test listing only failing examples."""
        step_id = uuid4()
        ex1 = make_example_response(step_id=step_id, label="FAIL", content="fail1")
        mock_example_service.list_failing_examples.return_value = [ex1]

        response = client.get(f"/api/steps/{step_id}/examples?label=FAIL")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["label"] == "FAIL"
        mock_example_service.list_failing_examples.assert_called_once()

    def test_list_examples_step_not_found(self, client, mock_example_service):
        """Test listing examples for non-existent step."""
        step_id = uuid4()
        mock_example_service.list_examples_by_step.side_effect = StepNotFoundError(
            step_id
        )

        response = client.get(f"/api/steps/{step_id}/examples")

        assert response.status_code == 404


class TestCreateExample:
    """Tests for POST /api/steps/{step_id}/examples endpoint."""

    def test_create_passing_example(self, client, mock_example_service):
        """Test creating a passing example."""
        step_id = uuid4()
        example_id = uuid4()
        mock_example_service.create_example.return_value = make_example_response(
            example_id=example_id,
            step_id=step_id,
            content="test content",
            label="PASS",
        )

        response = client.post(
            f"/api/steps/{step_id}/examples",
            json={
                "content": "test content",
                "content_type": "text",
                "label": "PASS",
                "description": "A passing example",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["label"] == "PASS"
        assert data["content"] == "test content"

    def test_create_failing_example(self, client, mock_example_service):
        """Test creating a failing example."""
        step_id = uuid4()
        example_id = uuid4()
        mock_example_service.create_example.return_value = make_example_response(
            example_id=example_id,
            step_id=step_id,
            content="bad content",
            label="FAIL",
        )

        response = client.post(
            f"/api/steps/{step_id}/examples",
            json={
                "content": "bad content",
                "content_type": "text",
                "label": "FAIL",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["label"] == "FAIL"

    def test_create_example_step_not_found(self, client, mock_example_service):
        """Test creating example for non-existent step."""
        step_id = uuid4()
        mock_example_service.create_example.side_effect = StepNotFoundError(step_id)

        response = client.post(
            f"/api/steps/{step_id}/examples",
            json={
                "content": "test",
                "label": "PASS",
            },
        )

        assert response.status_code == 404



class TestGetExample:
    """Tests for GET /api/examples/{example_id} endpoint."""

    def test_get_example_success(self, client, mock_example_service):
        """Test getting an example by ID."""
        example_id = uuid4()
        step_id = uuid4()
        mock_example_service.get_example.return_value = make_example_response(
            example_id=example_id,
            step_id=step_id,
            content="test content",
            label="PASS",
        )

        response = client.get(f"/api/examples/{example_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "test content"
        assert data["label"] == "PASS"

    def test_get_example_not_found(self, client, mock_example_service):
        """Test getting a non-existent example."""
        example_id = uuid4()
        mock_example_service.get_example.side_effect = ExampleNotFoundError(example_id)

        response = client.get(f"/api/examples/{example_id}")

        assert response.status_code == 404


class TestUpdateExample:
    """Tests for PUT /api/examples/{example_id} endpoint."""

    def test_update_example_success(self, client, mock_example_service):
        """Test updating an example."""
        example_id = uuid4()
        step_id = uuid4()
        mock_example_service.update_example.return_value = make_example_response(
            example_id=example_id,
            step_id=step_id,
            content="updated content",
            label="PASS",
        )

        response = client.put(
            f"/api/examples/{example_id}",
            json={"content": "updated content"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "updated content"

    def test_update_example_not_found(self, client, mock_example_service):
        """Test updating a non-existent example."""
        example_id = uuid4()
        mock_example_service.update_example.side_effect = ExampleNotFoundError(
            example_id
        )

        response = client.put(
            f"/api/examples/{example_id}",
            json={"content": "new content"},
        )

        assert response.status_code == 404


class TestDeleteExample:
    """Tests for DELETE /api/examples/{example_id} endpoint."""

    def test_delete_example_success(self, client, mock_example_service):
        """Test deleting an example."""
        example_id = uuid4()
        mock_example_service.delete_example.return_value = None

        response = client.delete(f"/api/examples/{example_id}")

        assert response.status_code == 204

    def test_delete_example_not_found(self, client, mock_example_service):
        """Test deleting a non-existent example."""
        example_id = uuid4()
        mock_example_service.delete_example.side_effect = ExampleNotFoundError(
            example_id
        )

        response = client.delete(f"/api/examples/{example_id}")

        assert response.status_code == 404
