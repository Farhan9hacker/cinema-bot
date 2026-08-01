from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Video, Clip
from app.schemas.schemas import SystemStatusResponse
from app.services.sys_info import get_system_metrics

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/status", response_model=SystemStatusResponse)
async def get_system_status(db: AsyncSession = Depends(get_db)):
    """Fetch live system metrics, active processing status, progress bar %, and queue totals."""
    metrics = get_system_metrics()

    # Video status counts
    v_counts_res = await db.execute(
        select(Video.status, func.count(Video.id)).group_by(Video.status)
    )
    video_status_counts = dict(v_counts_res.all())

    completed_videos = video_status_counts.get("completed", 0)
    failed_videos = video_status_counts.get("failed", 0) + video_status_counts.get("completed_with_errors", 0)
    total_videos = sum(video_status_counts.values())

    # Queue size
    q_size_res = await db.execute(
        select(func.count(Clip.id)).where(Clip.status.in_(["queued", "rendering"]))
    )
    queue_size = q_size_res.scalar() or 0

    # Active processing video details
    active_video_res = await db.execute(
        select(Video).where(Video.status == "processing").order_by(Video.updated_at.desc())
    )
    active_video = active_video_res.scalar_one_or_none()

    current_title = None
    current_video_id = None
    current_part = None
    completed_clips_count = 0
    total_clips_count = 0
    progress_percent = 0.0
    eta_seconds = None

    if active_video:
        current_title = active_video.filename
        current_video_id = active_video.id

        # Fetch clips for active video
        clips_res = await db.execute(
            select(Clip).where(Clip.video_id == active_video.id).order_by(Clip.part_number)
        )
        clips = clips_res.scalars().all()
        total_clips_count = len(clips)

        if total_clips_count > 0:
            completed_clips_count = sum(1 for c in clips if c.status == "completed")
            rendering_clip = next((c for c in clips if c.status == "rendering"), None)

            if rendering_clip:
                current_part = rendering_clip.part_number
            elif completed_clips_count < total_clips_count:
                current_part = completed_clips_count + 1

            progress_percent = round((completed_clips_count / total_clips_count) * 100.0, 1)

            # Rough ETA calculation: ~25s per 90s clip
            remaining_clips = total_clips_count - completed_clips_count
            eta_seconds = round(remaining_clips * 25.0, 1)

    return SystemStatusResponse(
        cpu_percent=metrics["cpu_percent"],
        ram_percent=metrics["ram_percent"],
        ram_used_gb=metrics["ram_used_gb"],
        ram_total_gb=metrics["ram_total_gb"],
        disk_percent=metrics["disk_percent"],
        disk_free_gb=metrics["disk_free_gb"],
        current_video_title=current_title,
        current_video_id=current_video_id,
        current_part=current_part,
        completed_clips_count=completed_clips_count,
        total_clips_count=total_clips_count,
        progress_percent=progress_percent,
        eta_seconds=eta_seconds,
        completed_videos_count=completed_videos,
        failed_videos_count=failed_videos,
        total_videos_count=total_videos,
        queue_size=queue_size,
        queue_paused=False
    )
