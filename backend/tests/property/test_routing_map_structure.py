"""
Property-based tests for Routing Map structure.

**Feature: universal-sop-architect, Property 8: Routing Map Structure**
**Validates: Requirements 7.3**

For any routing configuration with branches, the generated routing_map SHALL
include default_next and a branches array with condition_result, action_type,
and next_step_id for each branch.
"""

import pytest
from hypothesis import given, settings, HealthCheck
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.config import get_settings
from app.models.workflow import Workflow, WorkflowStep, RoutingBranch
from app.repositories.workflow import WorkflowRepository
from app.services.protocol import ProtocolService
from app.schemas.protocol import (
    ProtocolWorkflow,
    ProtocolRoutingMap,
    ProtocolRoutingBranch,
)
from tests.property.strategies import workflow_data, routing_branch_data
from hypothesis import strategies as st


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


def create_workflow_with_routing(data: dict) -> Workflow:
    """Create a Workflow model instance with routing branches from generated data."""
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


class TestRoutingMapStructure:
    """
    **Feature: universal-sop-architect, Property 8: Routing Map Structure**
    **Validates: Requirements 7.3**
    
    Property: For any routing configuration with branches, the generated routing_map
    SHALL include default_next and a branches array with condition_result, action_type,
    and next_step_id for each branch.
    """

    @given(data=workflow_data(min_steps=1, max_steps=5))
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_routing_map_has_default_next_and_branches(self, test_db, data):
        """
        **Feature: universal-sop-architect, Property 8: Routing Map Structure**
        **Validates: Requirements 7.3**
        
        Test that routing_map contains default_next and branches array.
        """
        # Create workflow from generated data
        workflow = create_workflow_with_routing(data)
        
        # Save to database
        repo = WorkflowRepository(test_db)
        saved_workflow = repo.create(workflow)
        workflow_id = saved_workflow.id
        
        # Generate protocol JSON
        protocol_service = ProtocolService(test_db)
        protocol = protocol_service.generate_protocol(workflow_id)
        
        # Verify each step's routing_map structure
        for i, step in enumerate(protocol.steps):
            routing_map = step.routing_map
            
            # Verify routing_map is a ProtocolRoutingMap instance
            assert isinstance(routing_map, ProtocolRoutingMap), (
                f"Step {i} routing_map should be ProtocolRoutingMap instance"
            )
            
            # Verify default_next exists and is a non-empty string
            assert routing_map.default_next is not None, (
                f"Step {i} routing_map should have default_next"
            )
            assert isinstance(routing_map.default_next, str), (
                f"Step {i} routing_map.default_next should be a string"
            )
            assert len(routing_map.default_next) > 0, (
                f"Step {i} routing_map.default_next should not be empty"
            )
            
            # Verify branches is a list
            assert routing_map.branches is not None, (
                f"Step {i} routing_map should have branches list"
            )
            assert isinstance(routing_map.branches, list), (
                f"Step {i} routing_map.branches should be a list"
            )
        
        # Cleanup
        repo.delete(saved_workflow)
        test_db.commit()

    @given(data=workflow_data(min_steps=1, max_steps=3))
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_routing_branches_have_required_fields(self, test_db, data):
        """
        **Feature: universal-sop-architect, Property 8: Routing Map Structure**
        **Validates: Requirements 7.3**
        
        Test that each branch in routing_map.branches has condition_result,
        action_type, and next_step_id fields.
        """
        # Create workflow from generated data
        workflow = create_workflow_with_routing(data)
        
        # Save to database
        repo = WorkflowRepository(test_db)
        saved_workflow = repo.create(workflow)
        workflow_id = saved_workflow.id
        
        # Generate protocol JSON
        protocol_service = ProtocolService(test_db)
        protocol = protocol_service.generate_protocol(workflow_id)
        
        # Verify each step's routing branches structure
        for step_idx, step in enumerate(protocol.steps):
            routing_map = step.routing_map
            
            for branch_idx, branch in enumerate(routing_map.branches):
                # Verify branch is a ProtocolRoutingBranch instance
                assert isinstance(branch, ProtocolRoutingBranch), (
                    f"Step {step_idx} branch {branch_idx} should be "
                    f"ProtocolRoutingBranch instance"
                )
                
                # Verify condition_result exists and is a non-empty string
                assert branch.condition_result is not None, (
                    f"Step {step_idx} branch {branch_idx} should have condition_result"
                )
                assert isinstance(branch.condition_result, str), (
                    f"Step {step_idx} branch {branch_idx} condition_result "
                    f"should be a string"
                )
                assert len(branch.condition_result) > 0, (
                    f"Step {step_idx} branch {branch_idx} condition_result "
                    f"should not be empty"
                )
                
                # Verify action_type exists and is a non-empty string
                assert branch.action_type is not None, (
                    f"Step {step_idx} branch {branch_idx} should have action_type"
                )
                assert isinstance(branch.action_type, str), (
                    f"Step {step_idx} branch {branch_idx} action_type "
                    f"should be a string"
                )
                assert len(branch.action_type) > 0, (
                    f"Step {step_idx} branch {branch_idx} action_type "
                    f"should not be empty"
                )
                
                # Verify next_step_id exists and is a non-empty string
                assert branch.next_step_id is not None, (
                    f"Step {step_idx} branch {branch_idx} should have next_step_id"
                )
                assert isinstance(branch.next_step_id, str), (
                    f"Step {step_idx} branch {branch_idx} next_step_id "
                    f"should be a string"
                )
                assert len(branch.next_step_id) > 0, (
                    f"Step {step_idx} branch {branch_idx} next_step_id "
                    f"should not be empty"
                )
        
        # Cleanup
        repo.delete(saved_workflow)
        test_db.commit()

    @given(data=workflow_data(min_steps=1, max_steps=3))
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_routing_branches_count_matches_input(self, test_db, data):
        """
        **Feature: universal-sop-architect, Property 8: Routing Map Structure**
        **Validates: Requirements 7.3**
        
        Test that the number of branches in the generated routing_map matches
        the number of routing branches in the input workflow step.
        """
        # Create workflow from generated data
        workflow = create_workflow_with_routing(data)
        
        # Save to database
        repo = WorkflowRepository(test_db)
        saved_workflow = repo.create(workflow)
        workflow_id = saved_workflow.id
        
        # Generate protocol JSON
        protocol_service = ProtocolService(test_db)
        protocol = protocol_service.generate_protocol(workflow_id)
        
        # Verify branch count matches for each step
        for step_idx, (input_step_data, protocol_step) in enumerate(
            zip(data["steps"], protocol.steps)
        ):
            input_branch_count = len(input_step_data.get("routing_branches", []))
            output_branch_count = len(protocol_step.routing_map.branches)
            
            assert output_branch_count == input_branch_count, (
                f"Step {step_idx}: Expected {input_branch_count} branches, "
                f"got {output_branch_count}"
            )
        
        # Cleanup
        repo.delete(saved_workflow)
        test_db.commit()
