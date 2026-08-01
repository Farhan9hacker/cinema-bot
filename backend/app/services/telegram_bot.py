import os
import time
import logging
import asyncio
from pathlib import Path
from typing import Optional

from app.config import settings

logger = logging.getLogger("shortforge.telegram_bot")


class TelegramBotListener:
    """Service to run Pyrogram MTProto bot client for unlimited (up to 2GB+) movie file downloads."""

    def __init__(self):
        self.app = None
        self.is_running = False

    async def start_bot(self, token: Optional[str] = None):
        """Initialize and start Pyrogram MTProto bot client listener."""
        bot_token = token or settings.TELEGRAM_BOT_TOKEN
        if not bot_token:
            logger.info("No TELEGRAM_BOT_TOKEN provided, skipping Telegram Bot listener polling.")
            return

        try:
            from pyrogram import Client, filters, enums
            from pyrogram.types import Message

            logger.info("Initializing Pyrogram MTProto Bot Client Listener...")

            api_id = settings.TELEGRAM_API_ID if hasattr(settings, "TELEGRAM_API_ID") and settings.TELEGRAM_API_ID else 6
            api_hash = settings.TELEGRAM_API_HASH if hasattr(settings, "TELEGRAM_API_HASH") and settings.TELEGRAM_API_HASH else "eb0663ab133162d98cd9e685f09623e1"

            # Create Pyrogram Client in memory session
            self.app = Client(
                name="shortforge_tg_bot",
                api_id=api_id,
                api_hash=api_hash,
                bot_token=bot_token,
                in_memory=True
            )

            @self.app.on_message(filters.command(["start", "help"]))
            async def cmd_start(_, message: Message):
                await message.reply_text(
                    "🎬 **ShortForge Automated Movie Bot Online!**\n\n"
                    "Forward any movie file or video message here to automatically download and split it into 9:16 vertical short clips for YouTube Shorts, TikTok, and Instagram Reels!",
                    parse_mode=enums.ParseMode.MARKDOWN
                )

            @self.app.on_message(filters.video | filters.document)
            async def handle_incoming_media(client: Client, message: Message):
                media = message.video or message.document
                if not media:
                    return

                file_name = getattr(media, "file_name", None) or f"telegram_movie_{media.file_unique_id}.mp4"
                file_size_bytes = getattr(media, "file_size", 0) or 0
                file_size_mb = round(file_size_bytes / (1024 * 1024), 2)

                status_msg = await message.reply_text(
                    f"📥 **Received Video File:** `{file_name}` ({file_size_mb} MB)\n"
                    f"⏳ Initializing MTProto high-speed stream into ShortForge `input/` folder...",
                    parse_mode=enums.ParseMode.MARKDOWN
                )

                os.makedirs(settings.INPUT_DIR, exist_ok=True)
                tmp_path = os.path.join(settings.INPUT_DIR, f"{file_name}.tmp")
                final_path = os.path.join(settings.INPUT_DIR, file_name)

                last_update_time = [time.time()]

                async def progress_callback(current, total):
                    now = time.time()
                    if now - last_update_time[0] >= 3.0 or current == total:
                        last_update_time[0] = now
                        percent = round((current * 100) / total, 1) if total > 0 else 0
                        curr_mb = round(current / (1024 * 1024), 1)
                        tot_mb = round(total / (1024 * 1024), 1)
                        try:
                            await status_msg.edit_text(
                                f"📥 **Downloading Movie File...** `{file_name}`\n"
                                f"📊 Progress: **{percent}%** ({curr_mb} MB / {tot_mb} MB)\n"
                                f"🚀 Streaming directly to ShortForge server!",
                                parse_mode=enums.ParseMode.MARKDOWN
                            )
                        except Exception:
                            pass

                try:
                    # Download 2GB+ media using Pyrogram MTProto stream
                    await client.download_media(
                        message=message,
                        file_name=tmp_path,
                        progress=progress_callback
                    )

                    if os.path.exists(tmp_path):
                        if os.path.exists(final_path):
                            os.remove(final_path)
                        os.rename(tmp_path, final_path)

                    await status_msg.edit_text(
                        f"✅ **Ingestion Completed!**\n"
                        f"🎬 Video `{file_name}` ({file_size_mb} MB) is now saved in ShortForge `input/` folder and is being split into 9:16 vertical short clips!",
                        parse_mode=enums.ParseMode.MARKDOWN
                    )
                except Exception as e:
                    logger.error(f"Error downloading Pyrogram MTProto media: {e}", exc_info=True)
                    await status_msg.edit_text(
                        f"❌ **Download Error:** {e}\n"
                        f"Please try resending or paste the link in the ShortForge Dashboard.",
                        parse_mode=enums.ParseMode.MARKDOWN
                    )

            await self.app.start()
            self.is_running = True
            logger.info("Pyrogram MTProto Telegram Bot Listener started successfully!")
        except Exception as e:
            logger.error(f"Failed to start Pyrogram Telegram Bot Listener: {e}")

    async def stop_bot(self):
        """Gracefully stop Pyrogram bot client."""
        if self.app and self.is_running:
            try:
                await self.app.stop()
                self.is_running = False
                logger.info("Pyrogram Telegram Bot Listener stopped.")
            except Exception as e:
                logger.warning(f"Error stopping Pyrogram Telegram Bot Listener: {e}")


telegram_bot_listener = TelegramBotListener()
