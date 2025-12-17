"""
Property-based tests for workflow persistence round-trip.

**Feature: universal-sop-architect, Property 2: Workflow Persistence Round-Trip**
**Validates: Requirements 10.1, 10.2, 10.3**

For any Workflow saved to storage, loading it back SHALL restore all steps,
micro-step data, and routing configurations exactly as they were saved.
"""

import os
import pytest
from hypothesis import given, settings, HealthCheck
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.config import get_settings
from app.models.workflow import Workflow, WorkflowStep, Example, RoutingBranch
from app.repositories.workflow import WorkflowRepository
from tests.property.strategies import workflow_data


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
        
        # Add examples
        for example_data in step_data.get("examples", []):
            example = Example(
                content=example_data["content"],
                content_type=example_data["content_type"],
                label=example_data["label"],
                description=example_data["description"],
            )
            step.examples.append(example)
        
        # Add routing branches
        for branch_data in step_data.get("routing_branches", []):
            branch = RoutingBranch(
                condition_result=branch_data["condition_result"],
                action_type=branch_data["action_type"],
                next_step_id=branch_data["next_step_id"],
            )
            step.routing_branches.append(branch)
        
        workflow.steps.append(step)
    
    return workflow


def compare_workflows(original_data: dict, loaded: Workflow) -> bool:
    """
    Compare original workflow data with loaded workflow.
    Returns True if they are equivalent.
    """
    # Compare workflow-level fields
    if loaded.name != original_data["name"]:
        return False
    if loaded.description != original_data["description"]:
        return False
    if loaded.cover_image_url != original_data["cover_image_url"]:
        return False
    if loaded.status != original_data["status"]:
        return False
    
    # Compare steps count
    if len(loaded.steps) != len(original_data["steps"]):
        return False
    
    # Compare each step
    for original_step, loaded_step in zip(original_data["steps"], loaded.steps):
        if not compare_steps(original_step, loaded_step):
            return False
    
    return True


def compare_steps(original: dict, loaded: WorkflowStep) -> bool:
    """Compare original step data with loaded step."""
    # Basic fields
    if loaded.name != original["name"]:
        return False
    if loaded.step_order != original["step_order"]:
        return False
    if loaded.status != original["status"]:
        return False
    
    # Context fields
    if loaded.context_type != original["context_type"]:
        return False
    if loaded.context_image_url != original["context_image_url"]:
        return False
    if loaded.context_text_content != original["context_text_content"]:
        return False
    if loaded.context_voice_transcript != original["context_voice_transcript"]:
        return False
    if loaded.context_description != original["context_description"]:
        return False
    
    # Extraction fields
    if loaded.extraction_keywords != original["extraction_keywords"]:
        return False
    if loaded.extraction_voice_transcript != original["extraction_voice_transcript"]:
        return False
    
    # Logic fields
    if loaded.logic_strategy != original["logic_strategy"]:
        return False
    if loaded.logic_rule_expression != original["logic_rule_expression"]:
        return False
    if loaded.logic_evaluation_prompt != original["logic_evaluation_prompt"]:
        return False
    
    # Routing fields
    if loaded.routing_default_next != original["routing_default_next"]:
        return False
    
    # Compare examples
    if len(loaded.examples) != len(original.get("examples", [])):
        return False
    
    for orig_ex, loaded_ex in zip(original.get("examples", []), loaded.examples):
        if not compare_examples(orig_ex, loaded_ex):
            return False
    
    # Compare routing branches
    if len(loaded.routing_branches) != len(original.get("routing_branches", [])):
        return False
    
    for orig_br, loaded_br in zip(original.get("routing_branches", []), loaded.routing_branches):
        if not compare_branches(orig_br, loaded_br):
            return False
    
    return True


def compare_examples(original: dict, loaded: Example) -> bool:
    """Compare original example data with loaded example."""
    return (
        loaded.content == original["content"]
        and loaded.content_type == original["content_type"]
        and loaded.label == original["label"]
        and loaded.description == original["description"]
    )


def compare_branches(original: dict, loaded: RoutingBranch) -> bool:
    """Compare original branch data with loaded branch."""
    return (
        loaded.condition_result == original["condition_result"]
        and loaded.action_type == original["action_type"]
        and loaded.next_step_id == original["next_step_id"]
    )


class TestWorkflowPersistenceRoundTrip:
    """
    **Feature: universal-sop-architect, Property 2: Workflow Persistence Round-Trip**
    **Validates: Requirements 10.1, 10.2, 10.3**
    
    Property: For any Workflow saved to storage, loading it back SHALL restore
    all steps, micro-step data, and routing configurations exactly as they were saved.
    """

    @given(data=workflow_data(min_steps=0, max_steps=5))
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_workflow_persistence_round_trip(self, test_db, data):
        """
        **Feature: universal-sop-architect, Property 2: Workflow Persistence Round-Trip**
        **Validates: Requirements 10.1, 10.2, 10.3**
        
        Test that saving and loading a workflow preserves all data.
        """
        # Create workflow from generated data
        workflow = create_workflow_from_data(data)
        
        # Save to database
        repo = WorkflowRepository(test_db)
        saved_workflow = repo.create(workflow)
        workflow_id = saved_workflow.id
        
        # Clear session to ensure fresh load
        test_db.expire_all()
        
        # Load from database
        loaded_workflow = repo.get_by_id(workflow_id)
        
        # Verify round-trip
        assert loaded_workflow is not None, "Workflow should be found after save"
        assert compare_workflows(data, loaded_workflow), (
            f"Loaded workflow should match original data.\n"
            f"Original: {data}\n"
            f"Loaded name: {loaded_workflow.name}, steps: {len(loaded_workflow.steps)}"
        )
        
        # Cleanup
        repo.delete(loaded_workflow)
        test_db.commit()
