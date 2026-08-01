from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Clip, Video, SystemLog
from app.schemas.schemas import ClipResponse
from app.worker.tasks import process_video_task

router = APIRouter(prefix="/queue", tags=["Queue"])


@router.get("/status")
async def get_queue_status(db: AsyncSession = Depends(get_db)):
    """Retrieve render queue status summary and queue items."""
    # Count by status
    result = await db.execute(
        select(Clip.status, func.count(Clip.id)).group_by(Clip.status)
    )
    status_counts = dict(result.all())

    # Get queued & rendering items
    result_items = await db.execute(
        select(Clip).where(Clip.status.in_(["queued", "rendering"])).order_by(Clip.created_at.asc()).limit(50)
    )
    queued_clips = result_items.scalars().all()

    return {
        "summary": {
            "queued": status_counts.get("queued", 0),
            "rendering": status_counts.get("rendering", 0),
            "completed": status_counts.get("completed", 0),
            "failed": status_counts.get("failed", 0),
            "total_clips": sum(status_counts.values())
        },
        "active_items": [ClipResponse.model_validate(c) for c in queued_clips]
    }


@router.post("/retry/{clip_id}", response_model=ClipResponse)
async def retry_clip(clip_id: int, db: AsyncSession = Depends(get_db)):
    """Reset retry count and re-queue a failed clip segment."""
    result = await db.execute(select(Clip).where(Clip.id == clip_id))
    clip = result.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip segment not found")

    clip.retry_count = 0
    clip.status = "queued"
    clip.error_message = None
    
    log_entry = SystemLog(
        level="INFO",
        category="queue",
        message=f"Manual retry triggered for clip ID {clip_id} (Part {clip.part_number})."
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(clip)

    # Trigger video processing
    process_video_task.delay(clip.video_id)

    return clip


@router.post("/resume-all")
async def resume_all_queue(db: AsyncSession = Depends(get_db)):
    """Re-trigger Celery worker tasks for all queued/processing videos."""
    result = await db.execute(select(Video).where(Video.status.in_(["pending", "processing", "paused"])))
    videos = result.scalars().all()

    resumed_ids = []
    for v in videos:
        v.status = "processing"
        process_video_task.delay(v.id)
        resumed_ids.append(v.id)

    await db.commit()
    return {"message": f"Resumed processing for {len(resumed_ids)} videos.", "video_ids": resumed_ids}
