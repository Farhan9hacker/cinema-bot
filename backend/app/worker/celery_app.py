import os
from celery import Celery
from app.config import settings

celery_app = Celery(
    "shortforge",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.worker.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour limit per video process
    worker_concurrency=settings.MAX_WORKERS if settings.MAX_WORKERS > 0 else (os.cpu_count() or 4)
)
