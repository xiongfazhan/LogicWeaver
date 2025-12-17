# -*- coding: utf-8 -*-
"""FastAPI application entry point."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.routers import example_router, file_router, protocol_router, step_router, workflow_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="专家经验数字化编译平台 - 将业务专家的直觉与流程编译为 AI 可执行的协议",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory and mount static files
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "app": settings.app_name}


# Register routers
app.include_router(workflow_router)
app.include_router(step_router)
app.include_router(example_router)
app.include_router(protocol_router)
app.include_router(file_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Universal SOP Architect API",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }
