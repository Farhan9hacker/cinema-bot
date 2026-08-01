from app.api.videos import router as videos_router
from app.api.queue import router as queue_router
from app.api.system import router as system_router
from app.api.settings import router as settings_router
from app.api.logs import router as logs_router

__all__ = [
    "videos_router",
    "queue_router",
    "system_router",
    "settings_router",
    "logs_router",
]
