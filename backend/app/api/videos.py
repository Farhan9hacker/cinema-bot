import os
import shutil
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.models.models import Video, Clip, SystemLog
from app.schemas.schemas import VideoResponse, VideoDetailResponse
from app.services.ffmpeg import FFmpegService
from app.worker.tasks import process_video_task

router = APIRouter(prefix="/videos", tags=["Videos"])


@router.get("", response_model=List[VideoResponse])
async def list_videos(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """List videos with optional status filtering."""
    query = select(Video).order_by(Video.created_at.desc()).offset(offset).limit(limit)
    if status_filter:
        query = query.where(Video.status == status_filter)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/upload", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload a new long video into input folder and trigger processing pipeline."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Ensure input folder exists
    os.makedirs(settings.INPUT_DIR, exist_ok=True)
    os.makedirs(settings.PROCESSING_DIR, exist_ok=True)

    input_path = os.path.join(settings.INPUT_DIR, file.filename)
    processing_path = os.path.join(settings.PROCESSING_DIR, file.filename)

    # Save uploaded file
    try:
        with open(processing_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded video: {str(e)}")

    # Extract metadata
    metadata = FFmpegService.get_metadata(processing_path)
    duration = metadata.get("duration", 0.0)
    resolution = metadata.get("resolution", "1920x1080")
    fps = metadata.get("fps", 30.0)

    # Calculate clip segments
    total_clips, segments = FFmpegService.calculate_clip_segments(duration, settings.DEFAULT_CLIP_LENGTH)
    archive_path = os.path.join(settings.ARCHIVE_DIR, file.filename)

    # Database records
    video = Video(
        filename=file.filename,
        original_path=input_path,
        processing_path=processing_path,
        archive_path=archive_path,
        duration_seconds=duration,
        resolution=resolution,
        fps=fps,
        total_clips=total_clips,
        status="processing"
    )
    db.add(video)
    await db.flush()

    # Create clip records
    clips = []
    for i, (start_t, end_t) in enumerate(segments, start=1):
        clip_filename = f"{os.path.splitext(file.filename)[0]}_part_{i:03d}.mp4"
        output_path = os.path.join(settings.OUTPUT_DIR, clip_filename)
        clip = Clip(
            video_id=video.id,
            part_number=i,
            filename=clip_filename,
            output_path=output_path,
            start_time=start_t,
            end_time=end_t,
            status="queued"
        )
        clips.append(clip)

    db.add_all(clips)

    log_entry = SystemLog(
        level="INFO",
        category="api",
        message=f"Uploaded and registered video '{file.filename}' ({duration:.1f}s, {total_clips} clips)."
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(video)

    # Dispatch Celery task
    process_video_task.delay(video.id)

    return video


@router.get("/{video_id}", response_model=VideoDetailResponse)
async def get_video(video_id: int, db: AsyncSession = Depends(get_db)):
    """Get video details and clip segments."""
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    result_clips = await db.execute(select(Clip).where(Clip.video_id == video_id).order_by(Clip.part_number))
    video.clips = result_clips.scalars().all()
    
    return video


@router.post("/{video_id}/start")
async def start_processing(video_id: int, db: AsyncSession = Depends(get_db)):
    """Start or re-trigger processing for a video."""
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.status = "processing"
    await db.commit()

    process_video_task.delay(video.id)
    return {"message": f"Processing started for video ID {video_id}", "status": "processing"}


@router.post("/{video_id}/pause")
async def pause_processing(video_id: int, db: AsyncSession = Depends(get_db)):
    """Pause processing for a video."""
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.status = "paused"
    await db.commit()
    return {"message": f"Processing paused for video ID {video_id}", "status": "paused"}


@router.post("/{video_id}/resume")
async def resume_processing(video_id: int, db: AsyncSession = Depends(get_db)):
    """Resume processing for a paused video."""
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.status = "processing"
    await db.commit()

    process_video_task.delay(video.id)
    return {"message": f"Processing resumed for video ID {video_id}", "status": "processing"}


@router.post("/{video_id}/cancel")
async def cancel_processing(video_id: int, db: AsyncSession = Depends(get_db)):
    """Cancel processing for a video."""
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.status = "cancelled"
    await db.commit()
    return {"message": f"Processing cancelled for video ID {video_id}", "status": "cancelled"}


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(video_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a video and its rendered clips."""
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Fetch associated clips
    result_clips = await db.execute(select(Clip).where(Clip.video_id == video_id))
    clips = result_clips.scalars().all()

    # Clean up output clip files
    for clip in clips:
        if os.path.exists(clip.output_path):
            try:
                os.remove(clip.output_path)
            except Exception:
                pass

    await db.delete(video)
    await db.commit()
