"""
Property-based tests for Protocol JSON structure completeness.

**Feature: universal-sop-architect, Property 6: Protocol JSON Structure Completeness**
**Validates: Requirements 7.1**

For any completed workflow step, the generated Protocol JSON SHALL contain
all required fields: input_spec, logic_config, routing_map, and output_schema.
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
    ProtocolStep,
    ProtocolInputSpec,
    ProtocolLogicConfig,
    ProtocolRoutingMap,
    ProtocolOutputSchema,
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


class TestProtocolJSONStructureCompleteness:
    """
    **Feature: universal-sop-architect, Property 6: Protocol JSON Structure Completeness**
    **Validates: Requirements 7.1**
    
    Property: For any completed workflow step, the generated Protocol JSON SHALL
    contain all required fields: input_spec, logic_config, routing_map, and output_schema.
    """

    @given(data=workflow_data(min_steps=1, max_steps=5))
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_protocol_json_structure_completeness(self, test_db, data):
        """
        **Feature: universal-sop-architect, Property 6: Protocol JSON Structure Completeness**
        **Validates: Requirements 7.1**
        
        Test that generated Protocol JSON contains all required fields for every step.
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
        
        # Verify workflow-level required fields
        assert protocol.workflow_id is not None, "Protocol should have workflow_id"
        assert protocol.workflow_name is not None, "Protocol should have workflow_name"
        assert protocol.steps is not None, "Protocol should have steps list"
        
        # Verify each step has all required fields
        for i, step in enumerate(protocol.steps):
            # Verify step is a ProtocolStep instance
            assert isinstance(step, ProtocolStep), (
                f"Step {i} should be a ProtocolStep instance"
            )
            
            # Verify step-level required fields
            assert step.step_id is not None, f"Step {i} should have step_id"
            assert step.step_name is not None, f"Step {i} should have step_name"
            assert step.business_domain is not None, f"Step {i} should have business_domain"
            
            # Verify input_spec exists and has required fields
            assert step.input_spec is not None, (
                f"Step {i} should have input_spec"
            )
            assert isinstance(step.input_spec, ProtocolInputSpec), (
                f"Step {i} input_spec should be ProtocolInputSpec instance"
            )
            assert step.input_spec.data_source is not None, (
                f"Step {i} input_spec should have data_source"
            )
            assert step.input_spec.target_section is not None, (
                f"Step {i} input_spec should have target_section"
            )
            assert step.input_spec.context_description is not None, (
                f"Step {i} input_spec should have context_description"
            )
            
            # Verify logic_config exists and has required fields
            assert step.logic_config is not None, (
                f"Step {i} should have logic_config"
            )
            assert isinstance(step.logic_config, ProtocolLogicConfig), (
                f"Step {i} logic_config should be ProtocolLogicConfig instance"
            )
            assert step.logic_config.logic_strategy is not None, (
                f"Step {i} logic_config should have logic_strategy"
            )
            assert step.logic_config.logic_strategy in ["RULE_BASED", "SEMANTIC_SIMILARITY"], (
                f"Step {i} logic_strategy should be valid enum value"
            )
            
            # Verify routing_map exists and has required fields
            assert step.routing_map is not None, (
                f"Step {i} should have routing_map"
            )
            assert isinstance(step.routing_map, ProtocolRoutingMap), (
                f"Step {i} routing_map should be ProtocolRoutingMap instance"
            )
            assert step.routing_map.default_next is not None, (
                f"Step {i} routing_map should have default_next"
            )
            assert step.routing_map.branches is not None, (
                f"Step {i} routing_map should have branches list"
            )
            
            # Verify output_schema exists and has required fields
            assert step.output_schema is not None, (
                f"Step {i} should have output_schema"
            )
            assert isinstance(step.output_schema, ProtocolOutputSchema), (
                f"Step {i} output_schema should be ProtocolOutputSchema instance"
            )
            assert step.output_schema.fields is not None, (
                f"Step {i} output_schema should have fields list"
            )
        
        # Cleanup
        repo.delete(saved_workflow)
        test_db.commit()

