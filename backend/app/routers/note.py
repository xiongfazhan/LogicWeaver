"""StepNote API router."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.services import note as note_service

router = APIRouter(prefix="/api/notes", tags=["notes"])


# ============================================================================
# Schemas
# ============================================================================

class NoteCreate(BaseModel):
    """Request schema for creating a note."""
    content_type: str  # image, voice, video, text
    content: str
    created_by: str = "worker"
    voice_transcript: Optional[str] = None


class NoteUpdate(BaseModel):
    """Request schema for updating a note."""
    content: Optional[str] = None
    voice_transcript: Optional[str] = None


class NoteResponse(BaseModel):
    """Response schema for a note."""
    id: UUID
    step_id: UUID
    content_type: str
    content: str
    voice_transcript: Optional[str]
    created_by: str

    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    """Response schema for note list."""
    items: List[NoteResponse]


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/step/{step_id}", response_model=NoteListResponse)
async def get_step_notes(
    step_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Get all notes for a step."""
    notes = await note_service.get_notes_by_step(db, step_id)
    return NoteListResponse(
        items=[
            NoteResponse(
                id=n.id,
                step_id=n.step_id,
                content_type=n.content_type,
                content=n.content,
                voice_transcript=n.voice_transcript,
                created_by=n.created_by,
            )
            for n in notes
        ]
    )


@router.post("/step/{step_id}", response_model=NoteResponse)
async def create_note(
    step_id: UUID,
    data: NoteCreate,
    db: AsyncSession = Depends(get_async_db),
):
    """Create a new note for a step."""
    note = await note_service.create_note(
        db,
        step_id=step_id,
        content_type=data.content_type,
        content=data.content,
        created_by=data.created_by,
        voice_transcript=data.voice_transcript,
    )
    
    return NoteResponse(
        id=note.id,
        step_id=note.step_id,
        content_type=note.content_type,
        content=note.content,
        voice_transcript=note.voice_transcript,
        created_by=note.created_by,
    )


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Get a single note by ID."""
    note = await note_service.get_note_by_id(db, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return NoteResponse(
        id=note.id,
        step_id=note.step_id,
        content_type=note.content_type,
        content=note.content,
        voice_transcript=note.voice_transcript,
        created_by=note.created_by,
    )


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    data: NoteUpdate,
    db: AsyncSession = Depends(get_async_db),
):
    """Update a note."""
    note = await note_service.update_note(
        db,
        note_id=note_id,
        content=data.content,
        voice_transcript=data.voice_transcript,
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return NoteResponse(
        id=note.id,
        step_id=note.step_id,
        content_type=note.content_type,
        content=note.content,
        voice_transcript=note.voice_transcript,
        created_by=note.created_by,
    )


@router.delete("/{note_id}")
async def delete_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_async_db),
):
    """Delete a note."""
    success = await note_service.delete_note(db, note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note deleted successfully"}
