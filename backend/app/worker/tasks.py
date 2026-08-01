import os
import shutil
import time
import logging
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.worker.celery_app import celery_app
from app.config import settings
from app.models.models import Video, Clip, Setting, SystemLog
from app.services.ffmpeg import FFmpegService
from app.services.sys_info import get_system_metrics

logger = logging.getLogger("shortforge.tasks")

# Create thread-safe synchronous database engine for Celery worker process
sync_db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://").replace("sqlite+aiosqlite://", "sqlite://")
sync_engine = create_engine(sync_db_url, pool_pre_ping=True)
SyncSessionLocal = sessionmaker(bind=sync_engine, expire_on_commit=False)


def _get_settings_dict_sync(session) -> dict:
    """Fetch current dynamic settings from database using synchronous session."""
    result = session.execute(select(Setting))
    db_settings = result.scalars().all()
    setting_map = {s.key: s.value for s in db_settings}

    return {
        "clip_length": int(setting_map.get("clip_length", settings.DEFAULT_CLIP_LENGTH)),
        "video_codec": setting_map.get("video_codec", settings.DEFAULT_VIDEO_CODEC),
        "bitrate": setting_map.get("bitrate", settings.DEFAULT_BITRATE),
        "fps": int(setting_map.get("fps", settings.DEFAULT_FPS)),
        "resolution": setting_map.get("resolution", settings.DEFAULT_RESOLUTION),
        "overlay_font": setting_map.get("overlay_font", settings.DEFAULT_OVERLAY_FONT),
        "overlay_size": int(setting_map.get("overlay_size", settings.DEFAULT_OVERLAY_SIZE)),
        "overlay_color": setting_map.get("overlay_color", settings.DEFAULT_OVERLAY_COLOR),
        "overlay_outline_color": setting_map.get("overlay_outline_color", settings.DEFAULT_OVERLAY_OUTLINE_COLOR),
        "overlay_outline_width": int(setting_map.get("overlay_outline_width", settings.DEFAULT_OVERLAY_OUTLINE_WIDTH)),
        "top_padding": int(setting_map.get("top_padding", settings.DEFAULT_TOP_PADDING)),
        "show_movie_title": setting_map.get("show_movie_title", "true").lower() == "true",
    }


def _process_video_sync(video_id: int):
    """Synchronous core execution logic for processing a video in Celery worker."""
    start_time = time.time()
    
    with SyncSessionLocal() as session:
        # Check system safety - Disk space check
        metrics = get_system_metrics()
        if metrics["disk_free_gb"] < settings.SAFE_DISK_FREE_GB:
            logger.error(f"Disk space low ({metrics['disk_free_gb']} GB free). Pausing pipeline for video ID {video_id}.")
            
            video = session.scalar(select(Video).where(Video.id == video_id))
            if video:
                video.status = "paused"
                video.error_message = f"Paused due to low disk space ({metrics['disk_free_gb']} GB free)."
                
            log_entry = SystemLog(
                level="ERROR",
                category="system",
                message=f"Processing paused for Video ID {video_id}: Disk space critically low ({metrics['disk_free_gb']} GB free)."
            )
            session.add(log_entry)
            session.commit()
            return

        # Fetch video record
        video = session.scalar(select(Video).where(Video.id == video_id))
        if not video or video.status == "paused":
            logger.info(f"Video ID {video_id} not found or paused, skipping processing.")
            return

        video.status = "processing"
        session.commit()

        # Fetch dynamic settings
        current_settings = _get_settings_dict_sync(session)

        # Resolve font path
        font_name = current_settings["overlay_font"]
        font_path = os.path.join(settings.FONTS_DIR, font_name)
        if not os.path.exists(font_path):
            font_path = None  # Fallback to system font if missing

        # Fetch clip segments for this video
        clips = session.scalars(
            select(Clip).where(Clip.video_id == video_id).order_by(Clip.part_number)
        ).all()

        total_clips = len(clips)
        completed_count = 0
        failed_count = 0

        logger.info(f"Starting clip rendering for Video ID {video_id} ('{video.filename}'): {total_clips} parts.")

        for clip in clips:
            if clip.status == "completed":
                completed_count += 1
                continue

            # Update status to rendering
            clip.status = "rendering"
            session.commit()

            success = False
            max_retries = 3

            while clip.retry_count <= max_retries and not success:
                logger.info(f"Rendering Video ID {video_id} Part {clip.part_number}/{total_clips} (Attempt {clip.retry_count + 1})...")
                
                render_ok = FFmpegService.render_clip(
                    input_path=video.processing_path,
                    output_path=clip.output_path,
                    start_time=clip.start_time,
                    end_time=clip.end_time,
                    movie_title=video.filename,
                    part_number=clip.part_number,
                    codec=current_settings["video_codec"],
                    bitrate=current_settings["bitrate"],
                    fps=current_settings["fps"],
                    resolution=current_settings["resolution"],
                    crop_mode=current_settings.get("crop_mode", "blur_pad"),
                    normalize_audio=current_settings.get("normalize_audio", True),
                    font_path=font_path,
                    font_size=current_settings["overlay_size"],
                    font_color=current_settings["overlay_color"],
                    outline_color=current_settings["overlay_outline_color"],
                    outline_width=current_settings["overlay_outline_width"],
                    top_padding=current_settings["top_padding"],
                    show_movie_title=current_settings["show_movie_title"],
                    hook_text=current_settings.get("hook_text", "MUST WATCH ENDING 🍿"),
                    enable_hook_text=current_settings.get("enable_hook_text", True),
                    watermark_handle=current_settings.get("watermark_handle", "@ShortForgeClips"),
                    enable_watermark=current_settings.get("enable_watermark", True)
                )

                if render_ok and os.path.exists(clip.output_path) and os.path.getsize(clip.output_path) > 0:
                    clip.status = "completed"
                    clip.error_message = None
                    success = True
                    completed_count += 1
                    logger.info(f"Part {clip.part_number}/{total_clips} rendered successfully.")
                else:
                    clip.retry_count += 1
                    logger.warning(f"Part {clip.part_number} rendering attempt failed. Retry count: {clip.retry_count}")
                    if clip.retry_count > max_retries:
                        clip.status = "failed"
                        clip.error_message = "FFmpeg transcoding failed after retries."
                        failed_count += 1

                session.commit()

        encoding_time = round(time.time() - start_time, 2)

        # Update final video state
        if completed_count == total_clips:
            video.status = "completed"
            
            # Archive original file
            if os.path.exists(video.processing_path):
                os.makedirs(settings.ARCHIVE_DIR, exist_ok=True)
                archive_target = os.path.join(settings.ARCHIVE_DIR, video.filename)
                try:
                    shutil.move(video.processing_path, archive_target)
                    video.archive_path = archive_target
                    logger.info(f"Archived original video '{video.filename}' to {archive_target}")
                except Exception as ex:
                    logger.warning(f"Failed to move original video to archive: {ex}")

            log_entry = SystemLog(
                level="INFO",
                category="transcode",
                message=f"Video '{video.filename}' processing completed in {encoding_time}s ({completed_count}/{total_clips} clips rendered)."
            )
        else:
            video.status = "failed" if completed_count == 0 else "completed_with_errors"
            log_entry = SystemLog(
                level="ERROR",
                category="transcode",
                message=f"Video '{video.filename}' processing finished with errors: {completed_count} succeeded, {failed_count} failed in {encoding_time}s."
            )

        session.add(log_entry)
        session.commit()


@celery_app.task(name="process_video_task", bind=True, max_retries=3)
def process_video_task(self, video_id: int):
    """Celery task entry point to process a long-form video."""
    logger.info(f"Celery worker received process_video_task for Video ID {video_id}")
    try:
        _process_video_sync(video_id)
    except Exception as exc:
        logger.error(f"Task process_video_task failed for Video ID {video_id}: {exc}", exc_info=True)
        raise self.retry(exc=exc, countdown=10)


@celery_app.task(name="resume_pending_tasks")
def resume_pending_tasks():
    """Periodic auto-recovery task to resume unfinished jobs after system reboot."""
    try:
        with SyncSessionLocal() as session:
            unprocessed_videos = session.scalars(
                select(Video).where(Video.status.in_(["pending", "processing"]))
            ).all()
            for v in unprocessed_videos:
                logger.info(f"Auto-resuming video ID {v.id} ('{v.filename}') after system reboot.")
                process_video_task.delay(v.id)
    except Exception as e:
        logger.error(f"Failed to execute resume_pending_tasks: {e}")
