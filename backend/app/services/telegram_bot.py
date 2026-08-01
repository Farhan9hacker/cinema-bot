import os
import asyncio
import logging
from pathlib import Path
from typing import Optional

from app.config import settings
from app.services.telegram_service import TelegramService

logger = logging.getLogger("shortforge.telegram_bot")


class TelegramBotListener:
    """Service to handle incoming forwarded Telegram video messages and download them into input/."""

    def __init__(self):
        self.is_running = False

    async def handle_forwarded_video(self, file_id: str, filename: Optional[str] = None) -> str:
        """Process forwarded video file_id and save directly to input directory."""
        os.makedirs(settings.INPUT_DIR, exist_ok=True)
        
        if not filename:
            filename = f"telegram_forwarded_{file_id[:10]}.mp4"
            
        target_path = os.path.join(settings.INPUT_DIR, filename)

        logger.info(f"Received forwarded Telegram video (ID: {file_id}). Downloading to {target_path}...")

        # Execute download stream
        res = await TelegramService.download_telegram_video(file_id, filename)
        logger.info(f"Forwarded video download completed: '{filename}' saved to input/ folder.")
        return res["path"]


telegram_bot_listener = TelegramBotListener()
