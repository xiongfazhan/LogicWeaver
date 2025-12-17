"""
Property-based tests for step addition invariant.

**Feature: universal-sop-architect, Property 4: Step Addition Invariant**
**Validates: Requirements 6.5**

For any workflow with N steps, adding a new step SHALL result in a workflow
with exactly N+1 steps.
"""

import pytest
from hypothesis import given, settings, HealthCheck
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.config import get_settings
from app.models.workflow import Workflow, WorkflowStep
from app.repositories.workflow import WorkflowRepository
from app.services.step import StepService
from app.schemas.workflow import WorkflowStepCreate
from tests.property.strategies import (
    workflow_data,
    workflow_step_data,
    name_strategy,
)


# Use PostgreSQL test database
app_settings = get_settings()
TEST_DATABASE_URL = app_settings.database_url_sync


@pytest.fixture(scope="function")
def test_db():
    """Create a database session for testing."""
    engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()


def create_workflow_from_data(data: dict) -> Workflow:
    """Create a Workflow model instance from generated data."""
    workflow = Workflow(
        name=data["name"],
        description=data["description"],
        cover_image_url=data["cover_image_url"],
        status=data["status"],
    )
    
    for step_data in data["steps"]:
        step = WorkflowStep(
            name=step_data["name"],
            step_order=step_data["step_order"],
            status=step_data["status"],
            context_type=step_data["context_type"],
            context_image_url=step_data["context_image_url"],
            context_text_content=step_data["context_text_content"],
            context_voice_transcript=step_data["context_voice_transcript"],
            context_description=step_data["context_description"],
            extraction_keywords=step_data["extraction_keywords"],
            extraction_voice_transcript=step_data["extraction_voice_transcript"],
            logic_strategy=step_data["logic_strategy"],
            logic_rule_expression=step_data["logic_rule_expression"],
            logic_evaluation_prompt=step_data["logic_evaluation_prompt"],
            routing_default_next=step_data["routing_default_next"],
        )
        workflow.steps.append(step)
    
    return workflow


class TestStepAdditionInvariant:
    """
    **Feature: universal-sop-architect, Property 4: Step Addition Invariant**
    **Validates: Requirements 6.5**
    
    Property: For any workflow with N steps, adding a new step SHALL result
    in a workflow with exactly N+1 steps.
    """

    @given(
        workflow=workflow_data(min_steps=0, max_steps=5),
        new_step_name=name_strategy,
    )
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_step_addition_increases_count_by_one(
        self, test_db, workflow, new_step_name
    ):
        """
        **Feature: universal-sop-architect, Property 4: Step Addition Invariant**
        **Validates: Requirements 6.5**
        
        Test that adding a step to a workflow increases the step count by exactly 1.
        """
        # Create and save the workflow
        workflow_model = create_workflow_from_data(workflow)
        workflow_repo = WorkflowRepository(test_db)
        saved_workflow = workflow_repo.create(workflow_model)
        workflow_id = saved_workflow.id
        
        # Get initial step count
        initial_count = len(saved_workflow.steps)
        
        # Create step service and add a new step
        step_service = StepService(test_db)
        
        # Create new step data with auto-order
        new_step_data = WorkflowStepCreate(
            name=new_step_name,
            step_order=0,  # Will be overridden by auto_order
            status="pending",
        )
        
        # Add the step using auto_order to avoid order conflicts
        step_service.create_step_auto_order(workflow_id, new_step_data)
        
        # Refresh the workflow to get updated steps
        test_db.expire_all()
        updated_workflow = workflow_repo.get_by_id(workflow_id)
        
        # Verify the invariant: step count should be exactly N+1
        final_count = len(updated_workflow.steps)
        
        assert final_count == initial_count + 1, (
            f"Step count should increase by exactly 1. "
            f"Initial: {initial_count}, Final: {final_count}, "
            f"Expected: {initial_count + 1}"
        )
        
        # Cleanup
        workflow_repo.delete(updated_workflow)
        test_db.commit()


