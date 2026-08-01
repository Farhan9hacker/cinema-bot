from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings as app_settings
from app.models.models import Setting, SystemLog
from app.schemas.schemas import SettingsSchema, SettingsUpdateSchema

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=SettingsSchema)
async def get_settings(db: AsyncSession = Depends(get_db)):
    """Retrieve application and video processing settings."""
    result = await db.execute(select(Setting))
    db_settings = result.scalars().all()
    setting_map = {s.key: s.value for s in db_settings}

    return SettingsSchema(
        clip_length=int(setting_map.get("clip_length", app_settings.DEFAULT_CLIP_LENGTH)),
        video_codec=setting_map.get("video_codec", app_settings.DEFAULT_VIDEO_CODEC),
        bitrate=setting_map.get("bitrate", app_settings.DEFAULT_BITRATE),
        resolution=setting_map.get("resolution", app_settings.DEFAULT_RESOLUTION),
        fps=int(setting_map.get("fps", app_settings.DEFAULT_FPS)),
        crop_mode=setting_map.get("crop_mode", app_settings.DEFAULT_CROP_MODE),
        normalize_audio=setting_map.get("normalize_audio", "true").lower() == "true",
        overlay_font=setting_map.get("overlay_font", app_settings.DEFAULT_OVERLAY_FONT),
        overlay_size=int(setting_map.get("overlay_size", app_settings.DEFAULT_OVERLAY_SIZE)),
        overlay_color=setting_map.get("overlay_color", app_settings.DEFAULT_OVERLAY_COLOR),
        overlay_outline_color=setting_map.get("overlay_outline_color", app_settings.DEFAULT_OVERLAY_OUTLINE_COLOR),
        overlay_outline_width=int(setting_map.get("overlay_outline_width", app_settings.DEFAULT_OVERLAY_OUTLINE_WIDTH)),
        top_padding=int(setting_map.get("top_padding", app_settings.DEFAULT_TOP_PADDING)),
        show_movie_title=setting_map.get("show_movie_title", "true").lower() == "true",
        hook_text=setting_map.get("hook_text", app_settings.DEFAULT_HOOK_TEXT),
        enable_hook_text=setting_map.get("enable_hook_text", "true").lower() == "true",
        watermark_handle=setting_map.get("watermark_handle", app_settings.DEFAULT_WATERMARK_HANDLE),
        enable_watermark=setting_map.get("enable_watermark", "true").lower() == "true",
        active_theme=setting_map.get("active_theme", app_settings.DEFAULT_THEME),
        upload_schedule=setting_map.get("upload_schedule", "immediate"),
        upload_interval_mins=int(setting_map.get("upload_interval_mins", 30)),
        auto_publish_youtube=setting_map.get("auto_publish_youtube", "true").lower() == "true",
        auto_publish_tiktok=setting_map.get("auto_publish_tiktok", "true").lower() == "true",
        auto_publish_instagram=setting_map.get("auto_publish_instagram", "false").lower() == "true",
        auto_publish_facebook=setting_map.get("auto_publish_facebook", "false").lower() == "true",
        telegram_bot_token=setting_map.get("telegram_bot_token", app_settings.TELEGRAM_BOT_TOKEN),
        telegram_chat_id=setting_map.get("telegram_chat_id", app_settings.TELEGRAM_CHAT_ID),
        telegram_auto_download=setting_map.get("telegram_auto_download", "true").lower() == "true",
        max_workers=int(setting_map.get("max_workers", app_settings.MAX_WORKERS))
    )


@router.put("", response_model=SettingsSchema)
async def update_settings(
    payload: SettingsUpdateSchema,
    db: AsyncSession = Depends(get_db)
):
    """Update dynamic settings in database."""
    update_data = payload.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if value is not None:
            str_val = str(value)
            result = await db.execute(select(Setting).where(Setting.key == key))
            setting_obj = result.scalar_one_or_none()
            if setting_obj:
                setting_obj.value = str_val
            else:
                setting_obj = Setting(key=key, value=str_val)
                db.add(setting_obj)

    log_entry = SystemLog(
        level="INFO",
        category="settings",
        message=f"Settings updated: {', '.join(update_data.keys())}"
    )
    db.add(log_entry)
    await db.commit()

    return await get_settings(db)
