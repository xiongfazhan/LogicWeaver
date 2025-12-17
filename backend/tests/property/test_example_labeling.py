"""
Property-based tests for example labeling consistency.

**Feature: universal-sop-architect, Property 3: Example Labeling Consistency**
**Validates: Requirements 4.4, 4.5**

For any example uploaded to the passing zone, the stored example SHALL have label "PASS";
for any example uploaded to the failing zone, the stored example SHALL have label "FAIL".
"""

import pytest
from hypothesis import given, settings, HealthCheck
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.config import get_settings
from app.models.workflow import Workflow, WorkflowStep, Example
from app.repositories.example import ExampleRepository
from app.services.example import ExampleService
from app.schemas.workflow import ExampleCreate
from tests.property.strategies import (
    safe_text,
    description_strategy,
    CONTENT_TYPES,
)
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


@pytest.fixture(scope="function")
def test_step(test_db):
    """Create a test workflow and step for example testing."""
    # Create a workflow
    workflow = Workflow(
        name="Test Workflow",
        description="Workflow for example labeling tests",
        status="draft",
    )
    test_db.add(workflow)
    test_db.commit()
    test_db.refresh(workflow)
    
    # Create a step
    step = WorkflowStep(
        workflow_id=workflow.id,
        name="Test Step",
        step_order=0,
        status="pending",
        logic_strategy="few_shot",
    )
    test_db.add(step)
    test_db.commit()
    test_db.refresh(step)
    
    yield step
    
    # Cleanup
    test_db.delete(workflow)
    test_db.commit()


# Strategy for generating example content
example_content_strategy = safe_text.filter(lambda x: x and len(x.strip()) > 0)


class TestExampleLabelingConsistency:
    """
    **Feature: universal-sop-architect, Property 3: Example Labeling Consistency**
    **Validates: Requirements 4.4, 4.5**
    
    Property: For any example uploaded to the passing zone, the stored example 
    SHALL have label "PASS"; for any example uploaded to the failing zone, 
    the stored example SHALL have label "FAIL".
    """

    @given(
        content=example_content_strategy,
        content_type=st.sampled_from(CONTENT_TYPES),
        description=description_strategy,
    )
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_passing_zone_labels_as_pass(
        self, test_db, test_step, content, content_type, description
    ):
        """
        **Feature: universal-sop-architect, Property 3: Example Labeling Consistency**
        **Validates: Requirements 4.4**
        
        Test that examples uploaded to the passing zone are labeled as PASS.
        """
        # Create example with PASS label (simulating upload to passing zone)
        service = ExampleService(test_db)
        example_data = ExampleCreate(
            content=content,
            content_type=content_type,
            label="PASS",
            description=description,
        )
        
        # Create the example
        created_example = service.create_example(test_step.id, example_data)
        
        # Verify the label is PASS
        assert created_example.label == "PASS", (
            f"Example uploaded to passing zone should have label 'PASS', "
            f"but got '{created_example.label}'"
        )
        
        # Verify by loading from database
        loaded_example = service.get_example(created_example.id)
        assert loaded_example.label == "PASS", (
            f"Loaded example should have label 'PASS', "
            f"but got '{loaded_example.label}'"
        )
        
        # Cleanup
        service.delete_example(created_example.id)

    @given(
        content=example_content_strategy,
        content_type=st.sampled_from(CONTENT_TYPES),
        description=description_strategy,
    )
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_failing_zone_labels_as_fail(
        self, test_db, test_step, content, content_type, description
    ):
        """
        **Feature: universal-sop-architect, Property 3: Example Labeling Consistency**
        **Validates: Requirements 4.5**
        
        Test that examples uploaded to the failing zone are labeled as FAIL.
        """
        # Create example with FAIL label (simulating upload to failing zone)
        service = ExampleService(test_db)
        example_data = ExampleCreate(
            content=content,
            content_type=content_type,
            label="FAIL",
            description=description,
        )
        
        # Create the example
        created_example = service.create_example(test_step.id, example_data)
        
        # Verify the label is FAIL
        assert created_example.label == "FAIL", (
            f"Example uploaded to failing zone should have label 'FAIL', "
            f"but got '{created_example.label}'"
        )
        
        # Verify by loading from database
        loaded_example = service.get_example(created_example.id)
        assert loaded_example.label == "FAIL", (
            f"Loaded example should have label 'FAIL', "
            f"but got '{loaded_example.label}'"
        )
        
        # Cleanup
        service.delete_example(created_example.id)

    @given(
        content=example_content_strategy,
        content_type=st.sampled_from(CONTENT_TYPES),
        description=description_strategy,
        label=st.sampled_from(["PASS", "FAIL"]),
    )
    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    def test_label_preserved_after_storage(
        self, test_db, test_step, content, content_type, description, label
    ):
        """
        **Feature: universal-sop-architect, Property 3: Example Labeling Consistency**
        **Validates: Requirements 4.4, 4.5**
        
        Test that the label provided during upload is preserved after storage.
        This is a combined property test that verifies both PASS and FAIL labels
        are correctly stored and retrieved.
        """
        service = ExampleService(test_db)
        example_data = ExampleCreate(
            content=content,
            content_type=content_type,
            label=label,
            description=description,
        )
        
        # Create the example
        created_example = service.create_example(test_step.id, example_data)
        
        # Verify the label matches what was provided
        assert created_example.label == label, (
            f"Created example label should be '{label}', "
            f"but got '{created_example.label}'"
        )
        
        # Verify by loading from database
        loaded_example = service.get_example(created_example.id)
        assert loaded_example.label == label, (
            f"Loaded example label should be '{label}', "
            f"but got '{loaded_example.label}'"
        )
        
        # Verify using the filtered list methods
        if label == "PASS":
            passing_examples = service.list_passing_examples(test_step.id)
            assert any(e.id == created_example.id for e in passing_examples), (
                "Example with PASS label should appear in passing examples list"
            )
        else:
            failing_examples = service.list_failing_examples(test_step.id)
            assert any(e.id == created_example.id for e in failing_examples), (
                "Example with FAIL label should appear in failing examples list"
            )
        
        # Cleanup
        service.delete_example(created_example.id)
