"""StepNote service for managing step notes/media."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import StepNote


async def get_notes_by_step(
    db: AsyncSession,
    step_id: UUID,
) -> List[StepNote]:
    """Get all notes for a step, ordered by created_at."""
    result = await db.execute(
        select(StepNote)
        .where(StepNote.step_id == step_id)
        .order_by(StepNote.created_at)
    )
    return list(result.scalars().all())


async def get_note_by_id(
    db: AsyncSession,
    note_id: UUID,
) -> Optional[StepNote]:
    """Get a single note by ID."""
    result = await db.execute(
        select(StepNote).where(StepNote.id == note_id)
    )
    return result.scalar_one_or_none()


async def create_note(
    db: AsyncSession,
    step_id: UUID,
    content_type: str,
    content: str,
    created_by: str = "worker",
    voice_transcript: Optional[str] = None,
) -> StepNote:
    """Create a new step note."""
    note = StepNote(
        step_id=step_id,
        content_type=content_type,
        content=content,
        created_by=created_by,
        voice_transcript=voice_transcript,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


async def update_note(
    db: AsyncSession,
    note_id: UUID,
    content: Optional[str] = None,
    voice_transcript: Optional[str] = None,
) -> Optional[StepNote]:
    """Update a note."""
    note = await get_note_by_id(db, note_id)
    if not note:
        return None
    
    if content is not None:
        note.content = content
    if voice_transcript is not None:
        note.voice_transcript = voice_transcript
    
    await db.commit()
    await db.refresh(note)
    return note


async def delete_note(
    db: AsyncSession,
    note_id: UUID,
) -> bool:
    """Delete a note."""
    note = await get_note_by_id(db, note_id)
    if not note:
        return False
    
    await db.delete(note)
    await db.commit()
    return True


async def get_notes_count_by_step(
    db: AsyncSession,
    step_id: UUID,
) -> int:
    """Get the count of notes for a step."""
    result = await db.execute(
        select(StepNote).where(StepNote.step_id == step_id)
    )
    return len(list(result.scalars().all()))
