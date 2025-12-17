"""Example API router."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.workflow import (
    ExampleCreate,
    ExampleResponse,
    ExampleUpdate,
)
from app.services.example import (
    ExampleNotFoundError,
    ExampleService,
    StepNotFoundError,
)

router = APIRouter(tags=["examples"])


def get_example_service(db: Session = Depends(get_db)) -> ExampleService:
    """Dependency to get example service."""
    return ExampleService(db)


@router.get(
    "/api/steps/{step_id}/examples",
    response_model=list[ExampleResponse],
)
async def list_examples(
    step_id: UUID,
    service: Annotated[ExampleService, Depends(get_example_service)],
    label: str | None = Query(
        None,
        description="Filter by label (PASS or FAIL)",
        pattern="^(PASS|FAIL)$",
    ),
) -> list[ExampleResponse]:
    """
    List all examples for a step.

    - **step_id**: UUID of the step
    - **label**: Optional filter by label (PASS or FAIL)
    """
    try:
        if label == "PASS":
            return service.list_passing_examples(step_id)
        elif label == "FAIL":
            return service.list_failing_examples(step_id)
        return service.list_examples_by_step(step_id)
    except StepNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )



@router.post(
    "/api/steps/{step_id}/examples",
    response_model=ExampleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_example(
    step_id: UUID,
    data: ExampleCreate,
    service: Annotated[ExampleService, Depends(get_example_service)],
) -> ExampleResponse:
    """
    Create a new example for a step.

    - **step_id**: UUID of the step
    - **content**: Example content (URL for image, text for text)
    - **content_type**: Content type ('image' or 'text')
    - **label**: Label ('PASS' or 'FAIL') - determines which upload zone
    - **description**: Optional description

    Note: The label determines whether this is a passing or failing example.
    Examples uploaded to the passing zone should have label='PASS',
    and examples uploaded to the failing zone should have label='FAIL'.
    """
    try:
        return service.create_example(step_id, data)
    except StepNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/api/examples/{example_id}",
    response_model=ExampleResponse,
)
async def get_example(
    example_id: UUID,
    service: Annotated[ExampleService, Depends(get_example_service)],
) -> ExampleResponse:
    """
    Get an example by ID.

    - **example_id**: UUID of the example
    """
    try:
        return service.get_example(example_id)
    except ExampleNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put(
    "/api/examples/{example_id}",
    response_model=ExampleResponse,
)
async def update_example(
    example_id: UUID,
    data: ExampleUpdate,
    service: Annotated[ExampleService, Depends(get_example_service)],
) -> ExampleResponse:
    """
    Update an example.

    - **example_id**: UUID of the example
    - All fields are optional for partial updates
    """
    try:
        return service.update_example(example_id, data)
    except ExampleNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete(
    "/api/examples/{example_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_example(
    example_id: UUID,
    service: Annotated[ExampleService, Depends(get_example_service)],
) -> None:
    """
    Delete an example.

    - **example_id**: UUID of the example
    """
    try:
        service.delete_example(example_id)
    except ExampleNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
