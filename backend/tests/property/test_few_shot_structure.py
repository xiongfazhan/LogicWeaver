"""
Property-based tests for Few-Shot Examples Structure.

**Feature: universal-sop-architect, Property 7: Few-Shot Examples Structure**
**Validates: Requirements 7.2**

For any logic configuration using Few-Shot mode, the generated logic_config SHALL
include a few_shot_examples array where each example has content, label, and description fields.
"""

import pytest
from hypothesis import given, settings, HealthCheck
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.config import get_settings
from app.models.workflow import Workflow, WorkflowStep, Example, RoutingBranch
from app.repositories.workflow import WorkflowRepository
from app.services.protocol import ProtocolService
from app.schemas.protocol import (
    ProtocolWorkflow,
    ProtocolFewShotExample,
)
from tests.property.strategies import workflow_data


# Use PostgreSQL test database
app_settings = get_settings()
TEST_DATABASE_URL = app_settings.database_url_sync


@pytest.fixture(scope="function")
def test_db():
    """Create a database session for testing."""
    engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
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


class TestFewShotExamplesStructure:
    """
    **Feature: universal-sop-architect, Property 7: Few-Shot Examples Structure**
    **Validates: Requirements 7.2**
    
    Property: For any logic configuration using Few-Shot mode, the generated
    logic_config SHALL include a few_shot_examples array where each example
    has content, label, and description fields.
    """

    @given(data=workflow_data(min_steps=1, max_steps=5))
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_few_shot_examples_structure(self, test_db, data):
        """
        **Feature: universal-sop-architect, Property 7: Few-Shot Examples Structure**
        **Validates: Requirements 7.2**
        
        Test that few_shot_examples array contains examples with content, label, and description.
        """
        # Create workflow from generated data
        workflow = create_workflow_from_data(data)
        
        # Save to database
        repo = WorkflowRepository(test_db)
        saved_workflow = repo.create(workflow)
        workflow_id = saved_workflow.id
        
        # Generate protocol JSON
        protocol_service = ProtocolService(test_db)
        protocol = protocol_service.generate_protocol(workflow_id)
        
        # Verify protocol is a ProtocolWorkflow instance
        assert isinstance(protocol, ProtocolWorkflow), (
            "Generated protocol should be a ProtocolWorkflow instance"
        )
        
        # Track original step data for comparison
        original_steps = data["steps"]
        
        # Verify each step's few_shot_examples structure
        for i, step in enumerate(protocol.steps):
            original_step = original_steps[i]
            
            # Only check steps that use few_shot strategy
            if original_step["logic_strategy"] == "few_shot":
                logic_config = step.logic_config
                
                # If there are examples in the original data, verify they are in the protocol
                original_examples = original_step.get("examples", [])
                
                if original_examples:
                    # few_shot_examples should exist and not be None
                    assert logic_config.few_shot_examples is not None, (
                        f"Step {i} with few_shot strategy and examples should have "
                        f"few_shot_examples in logic_config"
                    )
                    
                    # Verify each example has required fields
                    for j, example in enumerate(logic_config.few_shot_examples):
                        # Verify example is a ProtocolFewShotExample instance
                        assert isinstance(example, ProtocolFewShotExample), (
                            f"Step {i}, Example {j} should be a ProtocolFewShotExample instance"
                        )
                        
                        # Verify content field exists and is not None
                        assert example.content is not None, (
                            f"Step {i}, Example {j} should have content field"
                        )
                        assert isinstance(example.content, str), (
                            f"Step {i}, Example {j} content should be a string"
                        )
                        
                        # Verify label field exists and is valid
                        assert example.label is not None, (
                            f"Step {i}, Example {j} should have label field"
                        )
                        assert example.label in ["PASS", "FAIL"], (
                            f"Step {i}, Example {j} label should be 'PASS' or 'FAIL', "
                            f"got '{example.label}'"
                        )
                        
                        # Verify description field exists and is not None
                        assert example.description is not None, (
                            f"Step {i}, Example {j} should have description field"
                        )
                        assert isinstance(example.description, str), (
                            f"Step {i}, Example {j} description should be a string"
                        )
                    
                    # Verify the number of examples matches
                    assert len(logic_config.few_shot_examples) == len(original_examples), (
                        f"Step {i} should have {len(original_examples)} examples, "
                        f"got {len(logic_config.few_shot_examples)}"
                    )
        
        # Cleanup
        repo.delete(saved_workflow)
        test_db.commit()
