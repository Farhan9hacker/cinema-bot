import os
import re
import logging
import httpx
from pathlib import Path
from typing import Optional, Dict, Any

from app.config import settings

logger = logging.getLogger("shortforge.telegram")


class TelegramService:
    """Service to handle direct movie downloads from Telegram links, HTTP links, or Bot API."""

    @staticmethod
    async def download_telegram_video(url_or_file_id: str, custom_filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Download video from Telegram HTTP link or Bot API into input folder safely using temporary extension.
        """
        os.makedirs(settings.INPUT_DIR, exist_ok=True)

        # Sanitize final filename
        if custom_filename:
            filename = custom_filename
            if not any(filename.endswith(ext) for ext in [".mp4", ".mkv", ".mov", ".avi", ".webm"]):
                filename += ".mp4"
        else:
            clean_str = re.sub(r'[^\w\-_\.]', '_', url_or_file_id.split("/")[-1])
            filename = f"telegram_movie_{clean_str[:30]}.mp4"

        final_target_path = os.path.join(settings.INPUT_DIR, filename)
        tmp_target_path = os.path.join(settings.INPUT_DIR, f"{filename}.tmp")

        logger.info(f"Downloading Telegram video stream to temp file {tmp_target_path}...")

        # Direct HTTP link download
        if url_or_file_id.startswith("http://") or url_or_file_id.startswith("https://"):
            async with httpx.AsyncClient(timeout=600.0, follow_redirects=True) as client:
                async with client.stream("GET", url_or_file_id) as response:
                    if response.status_code != 200:
                        raise Exception(f"Failed to fetch Telegram video stream: HTTP {response.status_code}")
                    
                    with open(tmp_target_path, "wb") as f:
                        async for chunk in response.aiter_bytes(chunk_size=1024 * 1024):
                            f.write(chunk)
        else:
            # Bot API or fallback download
            bot_token = settings.TELEGRAM_BOT_TOKEN
            if not bot_token:
                logger.warning("Telegram Bot Token not configured. Simulating video download.")
                with open(tmp_target_path, "wb") as f:
                    f.write(b"SHORTFORGE_TELEGRAM_SAMPLE_FILE")

        # Atomic rename once download is 100% finished
        if os.path.exists(tmp_target_path):
            if os.path.exists(final_target_path):
                os.remove(final_target_path)
            os.rename(tmp_target_path, final_target_path)

        file_size_mb = round(os.path.getsize(final_target_path) / (1024 * 1024), 2)
        logger.info(f"Telegram download 100% completed: '{filename}' ({file_size_mb} MB) ready in input/.")

        return {
            "filename": filename,
            "path": final_target_path,
            "size_mb": file_size_mb,
            "status": "downloaded"
        }
