"""API Routers."""

from app.routers.analysis import router as analysis_router
from app.routers.example import router as example_router
from app.routers.file import router as file_router
from app.routers.protocol import router as protocol_router
from app.routers.step import router as step_router
from app.routers.workflow import router as workflow_router
from app.routers.task import router as task_router
from app.routers.note import router as note_router
from app.routers.template import router as template_router
from app.routers.status import router as status_router

__all__ = [
    "workflow_router",
    "step_router",
    "example_router",
    "protocol_router",
    "file_router",
    "analysis_router",
    "task_router",
    "note_router",
    "template_router",
    "status_router",
]

