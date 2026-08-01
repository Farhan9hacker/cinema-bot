from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import SystemLog
from app.schemas.schemas import TelegramDownloadRequest
from app.services.telegram_service import TelegramService

router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/download")
async def download_from_telegram(
    payload: TelegramDownloadRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Download movie file from Telegram link or file ID directly into input folder."""
    if not payload.url_or_file_id:
        raise HTTPException(status_code=400, detail="Telegram URL or file ID is required")

    try:
        result = await TelegramService.download_telegram_video(
            url_or_file_id=payload.url_or_file_id,
            custom_filename=payload.filename
        )

        log_entry = SystemLog(
            level="INFO",
            category="telegram",
            message=f"Downloaded Telegram movie '{result['filename']}' ({result['size_mb']} MB) into input folder."
        )
        db.add(log_entry)
        await db.commit()

        return {
            "message": f"Successfully downloaded '{result['filename']}' from Telegram into input folder.",
            "details": result
        }
    except Exception as e:
        log_entry = SystemLog(
            level="ERROR",
            category="telegram",
            message=f"Failed to download Telegram video: {str(e)}"
        )
        db.add(log_entry)
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Telegram download failed: {str(e)}")
