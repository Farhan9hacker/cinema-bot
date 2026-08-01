import os
import shutil
import time
import logging
import asyncio
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from app.config import settings

logger = logging.getLogger("shortforge.monitor")

VIDEO_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v"}
IGNORE_EXTENSIONS = {".tmp", ".part", ".download", ".crdownload", ".gitkeep"}


class VideoFolderHandler(FileSystemEventHandler):
    """Watchdog event handler for monitoring input folder."""

    def __init__(self, loop: asyncio.AbstractEventLoop):
        self.loop = loop
        super().__init__()

    def on_created(self, event):
        if event.is_directory:
            return
        
        file_path = event.src_path
        ext = Path(file_path).suffix.lower()

        if ext in IGNORE_EXTENSIONS:
            return

        if ext in VIDEO_EXTENSIONS:
            logger.info(f"New video detected in input folder: {file_path}")
            asyncio.run_coroutine_threadsafe(process_incoming_video(file_path), self.loop)


async def _wait_for_file_ready(file_path: str, timeout: int = 300) -> bool:
    """Wait until file size stops growing and file handle is available for reading."""
    start_time = time.time()
    last_size = -1

    while time.time() - start_time < timeout:
        if not os.path.exists(file_path):
            return False

        try:
            current_size = os.path.getsize(file_path)
            # File must be greater than 0 bytes and size unchanged for 2 iterations
            if current_size > 0 and current_size == last_size:
                # Try opening file to verify it's not locked by another process
                with open(file_path, "rb") as f:
                    f.read(1024)
                return True
            last_size = current_size
        except Exception:
            pass

        await asyncio.sleep(2)

    return False


async def process_incoming_video(file_path: str):
    """Move video from input/ to processing/ once file transfer completes, then trigger pipeline."""
    from app.database import AsyncSessionLocal
    from app.models.models import Video, Clip, SystemLog
    from app.services.ffmpeg import FFmpegService
    from app.worker.tasks import process_video_task

    ext = Path(file_path).suffix.lower()
    if ext in IGNORE_EXTENSIONS:
        return

    logger.info(f"Checking file readiness for: {file_path}...")
    ready = await _wait_for_file_ready(file_path, timeout=600)
    if not ready:
        logger.warning(f"File {file_path} is not ready or failed stability check, skipping ingestion.")
        return

    filename = os.path.basename(file_path)
    processing_path = os.path.join(settings.PROCESSING_DIR, filename)

    try:
        # Move file into processing directory safely
        os.makedirs(settings.PROCESSING_DIR, exist_ok=True)
        shutil.move(file_path, processing_path)
        logger.info(f"Moved video '{filename}' to processing folder: {processing_path}")

        # Extract metadata
        metadata = FFmpegService.get_metadata(processing_path)
        duration = metadata.get("duration", 0.0)
        resolution = metadata.get("resolution", "1920x1080")
        fps = metadata.get("fps", 30.0)

        # Check for invalid/empty file duration
        if duration <= 0:
            logger.error(f"Extracted invalid duration ({duration}s) for {processing_path}. Marking failed.")
            return

        # Calculate clip segments
        clip_length = settings.DEFAULT_CLIP_LENGTH
        total_clips, segments = FFmpegService.calculate_clip_segments(duration, clip_length)

        archive_path = os.path.join(settings.ARCHIVE_DIR, filename)

        async with AsyncSessionLocal() as session:
            video = Video(
                filename=filename,
                original_path=file_path,
                processing_path=processing_path,
                archive_path=archive_path,
                duration_seconds=duration,
                resolution=resolution,
                fps=fps,
                total_clips=total_clips,
                status="processing"
            )
            session.add(video)
            await session.flush()

            # Create clip records
            clips_to_add = []
            for i, (start_t, end_t) in enumerate(segments, start=1):
                clip_filename = f"{Path(filename).stem}_part_{i:03d}.mp4"
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
                clips_to_add.append(clip)
            
            session.add_all(clips_to_add)

            # Log system event
            log_entry = SystemLog(
                level="INFO",
                category="monitor",
                message=f"Ingested video '{filename}': {duration:.1f}s, {resolution}, {total_clips} clips scheduled."
            )
            session.add(log_entry)
            await session.commit()

            video_id = video.id

        # Dispatch Celery background task for full video clip rendering
        process_video_task.delay(video_id)
        logger.info(f"Dispatched Video ID {video_id} processing task to Celery queue.")

    except Exception as e:
        logger.error(f"Error processing incoming video {file_path}: {e}", exc_info=True)


class DirectoryWatcher:
    """Service to run folder watcher thread/observer."""

    def __init__(self):
        self.observer = None

    def start(self, loop: asyncio.AbstractEventLoop):
        os.makedirs(settings.INPUT_DIR, exist_ok=True)
        os.makedirs(settings.PROCESSING_DIR, exist_ok=True)
        os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
        os.makedirs(settings.ARCHIVE_DIR, exist_ok=True)
        os.makedirs(settings.LOGS_DIR, exist_ok=True)
        os.makedirs(settings.FONTS_DIR, exist_ok=True)

        event_handler = VideoFolderHandler(loop)
        self.observer = Observer()
        self.observer.schedule(event_handler, settings.INPUT_DIR, recursive=False)
        self.observer.start()
        logger.info(f"Directory Watcher started on input folder: {settings.INPUT_DIR}")

    def stop(self):
        if self.observer:
            self.observer.stop()
            self.observer.join()
            logger.info("Directory Watcher stopped.")


watcher_service = DirectoryWatcher()
