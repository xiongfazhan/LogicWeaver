"""
Property-based tests for branch removal completeness.

**Feature: universal-sop-architect, Property 5: Branch Removal Completeness**
**Validates: Requirements 5.4**

For any routing configuration with a branch, removing that branch SHALL result
in the branch no longer existing in the routing_map.branches array.
"""

import pytest
from hypothesis import given, settings, HealthCheck
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.config import get_settings
from app.models.workflow import Workflow, WorkflowStep, RoutingBranch
from app.repositories.workflow import WorkflowRepository
from app.services.step import StepService
from app.schemas.workflow import RoutingBranchCreate
from tests.property.strategies import (
    workflow_data,
    routing_branch_data,
    name_strategy,
)
from hypothesis import strategies as st


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


def create_workflow_with_step(db, workflow_data: dict) -> tuple[Workflow, WorkflowStep]:
    """Create a Workflow with at least one step from generated data."""
    workflow = Workflow(
        name=workflow_data["name"],
        description=workflow_data["description"],
        cover_image_url=workflow_data["cover_image_url"],
        status=workflow_data["status"],
    )
    
    # Create at least one step
    step = WorkflowStep(
        name="Test Step",
        step_order=0,
        status="pending",
    )
    workflow.steps.append(step)
    
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    db.refresh(step)
    
    return workflow, step


class TestBranchRemovalCompleteness:
    """
    **Feature: universal-sop-architect, Property 5: Branch Removal Completeness**
    **Validates: Requirements 5.4**
    
    Property: For any routing configuration with a branch, removing that branch
    SHALL result in the branch no longer existing in the routing_map.branches array.
    """

    @given(
        workflow=workflow_data(min_steps=0, max_steps=2),
        branch=routing_branch_data(),
    )
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_branch_removal_removes_branch_from_routing_map(
        self, test_db, workflow, branch
    ):
        """
        **Feature: universal-sop-architect, Property 5: Branch Removal Completeness**
        **Validates: Requirements 5.4**
        
        Test that removing a branch from a step results in the branch
        no longer existing in the step's routing_branches.
        """
        # Create workflow with a step
        workflow_model, step = create_workflow_with_step(test_db, workflow)
        step_id = step.id
        
        # Create step service
        step_service = StepService(test_db)
        
        # Add a routing branch to the step
        branch_create = RoutingBranchCreate(
            condition_result=branch["condition_result"],
            action_type=branch["action_type"],
            next_step_id=branch["next_step_id"],
        )
        
        updated_step = step_service.add_routing_branch(step_id, branch_create)
        
        # Verify branch was added
        assert len(updated_step.routing_branches) >= 1, (
            "Branch should have been added to the step"
        )
        
        # Get the branch ID that was just added
        added_branch_id = updated_step.routing_branches[-1].id
        
        # Remove the branch
        result_step = step_service.remove_routing_branch(step_id, added_branch_id)
        
        # Verify the branch no longer exists in routing_branches
        branch_ids = [b.id for b in result_step.routing_branches]
        
        assert added_branch_id not in branch_ids, (
            f"Branch {added_branch_id} should have been removed from routing_branches. "
            f"Current branch IDs: {branch_ids}"
        )
        
        # Cleanup
        workflow_repo = WorkflowRepository(test_db)
        workflow_repo.delete(workflow_model)
        test_db.commit()

    @given(
        workflow=workflow_data(min_steps=0, max_steps=2),
        branches=st.lists(routing_branch_data(), min_size=2, max_size=5),
        branch_index_to_remove=st.integers(min_value=0, max_value=4),
    )
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_removing_one_branch_preserves_others(
        self, test_db, workflow, branches, branch_index_to_remove
    ):
        """
        **Feature: universal-sop-architect, Property 5: Branch Removal Completeness**
        **Validates: Requirements 5.4**
        
        Test that removing one branch does not affect other branches.
        """
        # Ensure branch_index_to_remove is within bounds
        if branch_index_to_remove >= len(branches):
            branch_index_to_remove = len(branches) - 1
        
        # Create workflow with a step
        workflow_model, step = create_workflow_with_step(test_db, workflow)
        step_id = step.id
        
        # Create step service
        step_service = StepService(test_db)
        
        # Add all branches to the step
        added_branch_ids = []
        for branch in branches:
            branch_create = RoutingBranchCreate(
                condition_result=branch["condition_result"],
                action_type=branch["action_type"],
                next_step_id=branch["next_step_id"],
            )
            updated_step = step_service.add_routing_branch(step_id, branch_create)
            added_branch_ids.append(updated_step.routing_branches[-1].id)
        
        # Get the branch ID to remove
        branch_id_to_remove = added_branch_ids[branch_index_to_remove]
        expected_remaining_ids = [
            bid for i, bid in enumerate(added_branch_ids) 
            if i != branch_index_to_remove
        ]
        
        # Remove the selected branch
        result_step = step_service.remove_routing_branch(step_id, branch_id_to_remove)
        
        # Verify the removed branch is gone
        result_branch_ids = [b.id for b in result_step.routing_branches]
        
        assert branch_id_to_remove not in result_branch_ids, (
            f"Removed branch {branch_id_to_remove} should not be in routing_branches"
        )
        
        # Verify all other branches are preserved
        for expected_id in expected_remaining_ids:
            assert expected_id in result_branch_ids, (
                f"Branch {expected_id} should still exist after removing another branch"
            )
        
        # Cleanup
        workflow_repo = WorkflowRepository(test_db)
        workflow_repo.delete(workflow_model)
        test_db.commit()
