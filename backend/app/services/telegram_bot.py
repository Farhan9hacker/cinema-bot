import os
import asyncio
import logging
from pathlib import Path
from typing import Optional

from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

from app.config import settings

logger = logging.getLogger("shortforge.telegram_bot")


class TelegramBotListener:
    """Service to poll Telegram Bot API for forwarded movie messages and auto-download into input/."""

    def __init__(self):
        self.app = None
        self.is_running = False

    async def start_bot(self, token: Optional[str] = None):
        """Initialize and start Telegram bot long-polling listener."""
        bot_token = token or settings.TELEGRAM_BOT_TOKEN
        if not bot_token:
            logger.info("No TELEGRAM_BOT_TOKEN provided, skipping Telegram Bot listener polling.")
            return

        try:
            logger.info("Initializing Telegram Bot Polling Listener...")
            self.app = ApplicationBuilder().token(bot_token).build()

            # Register handlers
            self.app.add_handler(CommandHandler("start", self._cmd_start))
            self.app.add_handler(CommandHandler("help", self._cmd_start))
            self.app.add_handler(MessageHandler(filters.VIDEO | filters.Document.ALL, self._handle_incoming_media))

            await self.app.initialize()
            await self.app.start()
            await self.app.updater.start_polling(drop_pending_updates=True)
            self.is_running = True
            logger.info("Telegram Bot Polling Listener started successfully!")
        except Exception as e:
            logger.error(f"Failed to start Telegram Bot Listener: {e}")

    async def stop_bot(self):
        """Gracefully stop Telegram bot polling listener."""
        if self.app and self.is_running:
            try:
                await self.app.updater.stop()
                await self.app.stop()
                await self.app.shutdown()
                self.is_running = False
                logger.info("Telegram Bot Listener stopped.")
            except Exception as e:
                logger.warning(f"Error stopping Telegram Bot Listener: {e}")

    async def _cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Command handler for /start."""
        if not update.message:
            return
        await update.message.reply_text(
            "🎬 **ShortForge Automated Movie Bot Online!**\n\n"
            "Forward any movie file or video message here to automatically download and split it into 9:16 vertical short clips for YouTube Shorts, TikTok, and Instagram Reels!",
            parse_mode="Markdown"
        )

    async def _handle_incoming_media(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Message handler for forwarded or uploaded video files."""
        message = update.message
        if not message:
            return

        media = message.video or message.document
        if not media:
            return

        file_name = getattr(media, "file_name", None) or f"telegram_movie_{media.file_unique_id}.mp4"
        file_size_bytes = getattr(media, "file_size", 0) or 0
        file_size_mb = round(file_size_bytes / (1024 * 1024), 2)

        status_msg = await message.reply_text(
            f"📥 **Received Video File:** `{file_name}` ({file_size_mb} MB)\n"
            f"⏳ Ingesting into ShortForge `input/` folder...",
            parse_mode="Markdown"
        )

        try:
            os.makedirs(settings.INPUT_DIR, exist_ok=True)
            tmp_path = os.path.join(settings.INPUT_DIR, f"{file_name}.tmp")
            final_path = os.path.join(settings.INPUT_DIR, file_name)

            tg_file = await context.bot.get_file(media.file_id)
            await tg_file.download_to_drive(tmp_path)

            if os.path.exists(tmp_path):
                if os.path.exists(final_path):
                    os.remove(final_path)
                os.rename(tmp_path, final_path)

            await status_msg.edit_text(
                f"✅ **Ingestion Completed!**\n"
                f"🎬 Video `{file_name}` ({file_size_mb} MB) is now saved in ShortForge `input/` folder and is being split into 9:16 vertical short clips!",
                parse_mode="Markdown"
            )
        except Exception as e:
            logger.error(f"Error processing Telegram bot media upload: {e}", exc_info=True)
            await status_msg.edit_text(
                f"⚠️ **Notice:** Direct Bot API downloads support files up to 20MB.\n"
                f"For large movie files like `{file_name}` ({file_size_mb} MB), please paste the direct Telegram stream link or HTTP URL in the **ShortForge Dashboard** (Upload Video ➔ Telegram / URL tab).",
                parse_mode="Markdown"
            )


telegram_bot_listener = TelegramBotListener()
