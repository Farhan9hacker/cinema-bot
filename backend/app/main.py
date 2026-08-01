import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.api import videos_router, queue_router, system_router, settings_router, logs_router, telegram_router
from app.services.monitor import watcher_service

# Configure Logging
os.makedirs(settings.LOGS_DIR, exist_ok=True)
log_file = os.path.join(settings.LOGS_DIR, "shortforge.log")

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("shortforge")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup & shutdown."""
    logger.info("Initializing ShortForge Backend Application...")
    
    # 1. Initialize DB tables
    await init_db()
    
    # 2. Start folder watcher service
    loop = asyncio.get_running_loop()
    try:
        watcher_service.start(loop)
    except Exception as e:
        logger.warning(f"Directory Watcher failed to start: {e}")

    # 3. Start Telegram Bot Polling Listener
    try:
        from app.services.telegram_bot import telegram_bot_listener
        await telegram_bot_listener.start_bot()
    except Exception as e:
        logger.warning(f"Telegram Bot Listener failed to start: {e}")

    # 4. Auto-resume any pending or processing videos on startup
    try:
        from app.worker.tasks import resume_pending_tasks
        resume_pending_tasks.delay()
        logger.info("Triggered auto-resume for pending video jobs.")
    except Exception as e:
        logger.warning(f"Failed to trigger auto-resume task: {e}")

    yield

    # Shutdown logic
    logger.info("Shutting down ShortForge Backend...")
    try:
        from app.services.telegram_bot import telegram_bot_listener
        await telegram_bot_listener.stop_bot()
    except Exception:
        pass

    try:
        watcher_service.stop()
    except Exception:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ShortForge Automated Video-to-Shorts Processing Pipeline API",
    lifespan=lifespan
)

# Enable CORS for local development and Nginx proxy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for rendered output clips preview
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
app.mount("/static/output", StaticFiles(directory=settings.OUTPUT_DIR), name="output_files")

# Include Routers under /api
app.include_router(system_router, prefix="/api")
app.include_router(videos_router, prefix="/api")
app.include_router(queue_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(logs_router, prefix="/api")
app.include_router(telegram_router, prefix="/api")


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": settings.VERSION}
