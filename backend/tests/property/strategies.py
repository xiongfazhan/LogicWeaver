"""Hypothesis strategies for generating test data."""

from hypothesis import strategies as st
from uuid import uuid4


# Valid values for enum-like fields
WORKFLOW_STATUSES = ["draft", "deployed"]
STEP_STATUSES = ["pending", "completed"]
CONTEXT_TYPES = ["image", "text", "voice"]
LOGIC_STRATEGIES = ["rule_based", "few_shot"]
CONTENT_TYPES = ["image", "text"]
EXAMPLE_LABELS = ["PASS", "FAIL"]


def sanitize_for_postgres(s: str) -> str:
    """Remove NUL characters that PostgreSQL doesn't allow in text fields."""
    if s is None:
        return None
    return s.replace("\x00", "")


# Use printable characters to avoid NUL and other problematic characters
safe_text = st.text(
    alphabet=st.characters(
        whitelist_categories=("L", "N", "P", "S", "Z"),
        blacklist_characters="\x00",
    ),
    min_size=0,
    max_size=200,
).map(sanitize_for_postgres)


# Basic string strategies with reasonable constraints
name_strategy = st.text(
    alphabet=st.characters(
        whitelist_categories=("L", "N"),
        whitelist_characters=" _-",
        blacklist_characters="\x00",
    ),
    min_size=1,
    max_size=100,
).filter(lambda x: x and x.strip()).map(sanitize_for_postgres)

description_strategy = st.one_of(
    st.none(),
    safe_text,
)

url_strategy = st.one_of(
    st.none(),
    st.text(
        alphabet=st.characters(whitelist_categories=("L", "N"), blacklist_characters="\x00"),
        min_size=1,
        max_size=50,
    ).map(lambda x: f"/uploads/{sanitize_for_postgres(x)}.jpg"),
)

keywords_strategy = st.one_of(
    st.none(),
    st.lists(
        st.text(
            alphabet=st.characters(whitelist_categories=("L", "N"), blacklist_characters="\x00"),
            min_size=1,
            max_size=50,
        ).map(sanitize_for_postgres),
        min_size=0,
        max_size=5,
    ),
)


@st.composite
def routing_branch_data(draw):
    """Generate routing branch data."""
    return {
        "condition_result": draw(st.sampled_from(["PASS", "FAIL", "UNSTABLE"])),
        "action_type": draw(st.sampled_from(["CONTINUE", "REJECT", "ESCALATE", "END"])),
        "next_step_id": draw(st.one_of(
            st.just("next"),
            st.just("end_process"),
            st.uuids().map(str),
        )),
    }


@st.composite
def example_data(draw):
    """Generate example data for Few-Shot learning."""
    return {
        "content": draw(safe_text.filter(lambda x: x and len(x) > 0)),
        "content_type": draw(st.sampled_from(CONTENT_TYPES)),
        "label": draw(st.sampled_from(EXAMPLE_LABELS)),
        "description": draw(description_strategy),
    }


@st.composite
def workflow_step_data(draw, step_order: int):
    """Generate workflow step data."""
    logic_strategy = draw(st.one_of(st.none(), st.sampled_from(LOGIC_STRATEGIES)))
    
    return {
        "name": draw(name_strategy),
        "step_order": step_order,
        "status": draw(st.sampled_from(STEP_STATUSES)),
        # Context
        "context_type": draw(st.one_of(st.none(), st.sampled_from(CONTEXT_TYPES))),
        "context_image_url": draw(url_strategy),
        "context_text_content": draw(description_strategy),
        "context_voice_transcript": draw(description_strategy),
        "context_description": draw(description_strategy),
        # Extraction
        "extraction_keywords": draw(keywords_strategy),
        "extraction_voice_transcript": draw(description_strategy),
        # Logic
        "logic_strategy": logic_strategy,
        "logic_rule_expression": draw(description_strategy) if logic_strategy == "rule_based" else None,
        "logic_evaluation_prompt": draw(description_strategy) if logic_strategy == "few_shot" else None,
        # Routing
        "routing_default_next": draw(st.one_of(st.none(), st.just("next"), st.uuids().map(str))),
    }


@st.composite
def workflow_data(draw, min_steps: int = 0, max_steps: int = 5):
    """Generate complete workflow data with steps, examples, and branches."""
    num_steps = draw(st.integers(min_value=min_steps, max_value=max_steps))
    
    steps = []
    for i in range(num_steps):
        step = draw(workflow_step_data(i))
        
        # Add examples if using few_shot strategy
        if step["logic_strategy"] == "few_shot":
            num_examples = draw(st.integers(min_value=0, max_value=3))
            step["examples"] = [draw(example_data()) for _ in range(num_examples)]
        else:
            step["examples"] = []
        
        # Add routing branches
        num_branches = draw(st.integers(min_value=0, max_value=3))
        step["routing_branches"] = [draw(routing_branch_data()) for _ in range(num_branches)]
        
        steps.append(step)
    
    return {
        "name": draw(name_strategy),
        "description": draw(description_strategy),
        "cover_image_url": draw(url_strategy),
        "status": draw(st.sampled_from(WORKFLOW_STATUSES)),
        "steps": steps,
    }
