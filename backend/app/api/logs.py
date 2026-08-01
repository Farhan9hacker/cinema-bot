import os
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.models.models import SystemLog
from app.schemas.schemas import SystemLogSchema

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get("", response_model=List[SystemLogSchema])
async def list_logs(
    level: Optional[str] = Query(None, description="Filter by log level (INFO, WARNING, ERROR)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve system execution logs from DB."""
    query = select(SystemLog).order_by(SystemLog.timestamp.desc()).limit(limit)
    if level:
        query = query.where(SystemLog.level == level.upper())
    if category:
        query = query.where(SystemLog.category == category.lower())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/download")
async def download_logs():
    """Download plain text log file."""
    log_file_path = os.path.join(settings.LOGS_DIR, "shortforge.log")

    if not os.path.exists(log_file_path):
        # Create dummy file if missing
        os.makedirs(settings.LOGS_DIR, exist_ok=True)
        with open(log_file_path, "w") as f:
            f.write("--- ShortForge System Log Initialized ---\n")

    return FileResponse(
        path=log_file_path,
        filename="shortforge.log",
        media_type="text/plain"
    )
