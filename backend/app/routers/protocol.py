"""Protocol API router for generating Protocol JSON."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.protocol import ProtocolWorkflow
from app.services.protocol import ProtocolService, WorkflowNotFoundError

router = APIRouter(prefix="/api/protocol", tags=["protocol"])


@router.get(
    "/{workflow_id}",
    response_model=ProtocolWorkflow,
    summary="Generate Protocol JSON",
    description="Generate Protocol JSON from a workflow for Agent engine consumption.",
)
def get_protocol(
    workflow_id: UUID,
    db: Session = Depends(get_db),
) -> ProtocolWorkflow:
    """Generate and return Protocol JSON for a workflow.
    
    Args:
        workflow_id: The UUID of the workflow to convert
        db: Database session
        
    Returns:
        ProtocolWorkflow containing the protocol JSON structure
        
    Raises:
        HTTPException 404: If the workflow is not found
    """
    service = ProtocolService(db)
    try:
        return service.generate_protocol(workflow_id)
    except WorkflowNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
