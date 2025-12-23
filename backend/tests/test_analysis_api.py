"""Tests for AI Analysis API."""

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db
from app.services.ai_analysis import AnalysisResult


# Create test client
client = TestClient(app)


class TestAnalysisStatusEndpoint:
    """Tests for /api/analysis/status endpoint."""

    def test_get_llm_status(self):
        """Test getting LLM service status."""
        response = client.get("/api/analysis/status")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "enabled" in data
        assert "provider" in data
        assert "model" in data
        assert "api_base" in data


class TestAnalyzeStepExamplesEndpoint:
    """Tests for /api/analysis/steps/{step_id}/analyze endpoint."""

    def test_analyze_nonexistent_step(self, test_db):
        """Test analyzing examples for non-existent step returns 404."""
        fake_step_id = uuid4()
        
        with patch("app.routers.analysis.get_llm_service") as mock_llm:
            mock_llm.return_value.is_enabled.return_value = True
            
            response = client.post(f"/api/analysis/steps/{fake_step_id}/analyze")
        
        assert response.status_code == 404

    def test_analyze_with_llm_disabled(self, test_db):
        """Test that analysis fails when LLM is disabled."""
        fake_step_id = uuid4()
        
        with patch("app.routers.analysis.get_llm_service") as mock_llm:
            mock_llm.return_value.is_enabled.return_value = False
            
            response = client.post(f"/api/analysis/steps/{fake_step_id}/analyze")
        
        assert response.status_code == 503
        assert "disabled" in response.json()["detail"].lower()


class TestLLMService:
    """Tests for LLM Service."""

    def test_llm_service_initialization(self):
        """Test LLM service can be initialized."""
        from app.services.llm import LLMService
        
        service = LLMService()
        assert service is not None
        assert service.model is not None

    def test_llm_service_is_enabled(self):
        """Test LLM service enabled check."""
        from app.services.llm import LLMService
        
        service = LLMService()
        # Should return bool
        assert isinstance(service.is_enabled(), bool)


class TestAIAnalysisService:
    """Tests for AI Analysis Service."""

    def test_build_analysis_input(self, test_db):
        """Test building analysis input from examples."""
        from app.services.ai_analysis import AIAnalysisService
        from app.models.workflow import Example
        
        # Create mock examples
        pass_example = MagicMock(spec=Example)
        pass_example.content = "This is a passing sample"
        pass_example.content_type = "text"
        pass_example.description = "Good example"
        
        fail_example = MagicMock(spec=Example)
        fail_example.content = "This is a failing sample"
        fail_example.content_type = "text"
        fail_example.description = "Bad example"
        
        # Create service with mock LLM
        mock_llm = MagicMock()
        service = AIAnalysisService(test_db, mock_llm)
        
        # Build input
        result = service._build_analysis_input([pass_example], [fail_example])
        
        assert "PASS" in result
        assert "FAIL" in result
        assert "passing sample" in result
        assert "failing sample" in result

    def test_parse_analysis_result_valid_json(self, test_db):
        """Test parsing valid JSON response."""
        from app.services.ai_analysis import AIAnalysisService
        
        mock_llm = MagicMock()
        service = AIAnalysisService(test_db, mock_llm)
        
        raw_response = '''```json
{
    "passing_features": ["feature1", "feature2"],
    "failing_features": ["bad1", "bad2"],
    "evaluation_prompt": "Check if the input matches passing features",
    "confidence_score": 0.85,
    "analysis_summary": "Analysis complete"
}
```'''
        
        result = service._parse_analysis_result(raw_response)
        
        assert result.passing_features == ["feature1", "feature2"]
        assert result.failing_features == ["bad1", "bad2"]
        assert result.confidence_score == 0.85

    def test_parse_analysis_result_invalid_json(self, test_db):
        """Test parsing invalid JSON returns fallback result."""
        from app.services.ai_analysis import AIAnalysisService
        
        mock_llm = MagicMock()
        service = AIAnalysisService(test_db, mock_llm)
        
        raw_response = "This is not valid JSON"
        
        result = service._parse_analysis_result(raw_response)
        
        # Should return fallback result
        assert result.confidence_score == 0.0
        assert "无法解析" in result.passing_features
