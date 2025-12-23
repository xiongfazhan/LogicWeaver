"""Analysis API router for AI-powered sample analysis."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.ai_analysis import (
    AIAnalysisService,
    AnalysisError,
    AnalysisResponse,
    InsufficientExamplesError,
    StepNotFoundError,
)
from app.services.llm import get_llm_service

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


class AnalyzeStepRequest(BaseModel):
    """请求体：分析步骤"""
    previous_outputs: Optional[list[dict]] = None  # 前序步骤的输出变量


@router.post(
    "/steps/{step_id}/analyze",
    response_model=AnalysisResponse,
    summary="Analyze step and generate data contract",
    description="""
    Trigger AI analysis of a step's description and materials.
    
    This endpoint:
    1. Reads the step's description and uploaded materials
    2. Calls LLM to generate Data Flow Specification (data contract)
    3. Returns inputs/outputs definition for Dify developers
    
    **Context Awareness:** Pass previous_outputs to ensure consistent variable naming.
    """,
)
def analyze_step_examples(
    step_id: UUID,
    request: Optional[AnalyzeStepRequest] = Body(default=None),
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """
    Analyze a step using LLM and generate data contract.
    
    Args:
        step_id: UUID of the step to analyze
        request: Optional request body with previous_outputs
        db: Database session
        
    Returns:
        AnalysisResponse containing data contract (inputs/outputs)
    """
    # Check if LLM is enabled
    llm_service = get_llm_service()
    if not llm_service.is_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM service is disabled. Please enable it in configuration.",
        )

    service = AIAnalysisService(db, llm_service)
    
    # Extract previous_outputs from request body
    previous_outputs = request.previous_outputs if request else None
    
    try:
        result = service.analyze_step_examples(step_id, previous_outputs)
        return result
        
    except StepNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Step with id {step_id} not found",
        )
    except InsufficientExamplesError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except AnalysisError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {e}",
        )


@router.get(
    "/status",
    summary="Check LLM service status",
    description="Check if the LLM service is enabled and properly configured.",
)
def get_llm_status() -> dict:
    """
    Get LLM service status.
    
    Returns:
        Dict with enabled status, provider, and model info.
    """
    from app.core.config import get_settings
    
    settings = get_settings()
    llm_service = get_llm_service()
    
    return {
        "enabled": llm_service.is_enabled(),
        "provider": settings.llm_provider,
        "model": settings.llm_model,
        "api_base": settings.llm_api_base,
    }
