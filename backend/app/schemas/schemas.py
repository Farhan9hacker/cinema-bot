from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ClipResponse(BaseModel):
    id: int
    video_id: int
    part_number: int
    filename: str
    output_path: str
    start_time: float
    end_time: float
    status: str
    created_at: datetime
    upload_time: Optional[datetime] = None
    retry_count: int
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class VideoResponse(BaseModel):
    id: int
    filename: str
    original_path: str
    processing_path: str
    archive_path: Optional[str] = None
    duration_seconds: float
    resolution: str
    fps: float
    total_clips: int
    status: str
    created_at: datetime
    updated_at: datetime
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class VideoDetailResponse(VideoResponse):
    clips: List[ClipResponse] = []


class SystemStatusResponse(BaseModel):
    cpu_percent: float
    ram_percent: float
    ram_used_gb: float
    ram_total_gb: float
    disk_percent: float
    disk_free_gb: float
    current_video_title: Optional[str] = None
    current_video_id: Optional[int] = None
    current_part: Optional[int] = None
    completed_clips_count: int = 0
    total_clips_count: int = 0
    progress_percent: float = 0.0
    eta_seconds: Optional[float] = None
    completed_videos_count: int = 0
    failed_videos_count: int = 0
    total_videos_count: int = 0
    
    queue_size: int = 0
    queue_paused: bool = False


class SettingsSchema(BaseModel):
    clip_length: int = Field(default=90, description="Clip duration in seconds")
    video_codec: str = Field(default="h264", description="Video codec (h264 or h265)")
    bitrate: str = Field(default="6M", description="Video bitrate e.g. 6M")
    resolution: str = Field(default="1080x1920", description="Output vertical resolution e.g. 1080x1920")
    fps: int = Field(default=30, description="Target frame rate")
    overlay_font: str = Field(default="DejaVuSans-Bold.ttf", description="Font filename or system font")
    overlay_size: int = Field(default=54, description="Font size in pixels")
    overlay_color: str = Field(default="white", description="Text color")
    overlay_outline_color: str = Field(default="black", description="Text outline border color")
    overlay_outline_width: int = Field(default=4, description="Outline border width")
    top_padding: int = Field(default=120, description="Top padding from screen top")
    show_movie_title: bool = Field(default=True, description="Show movie title text on overlay")
    upload_schedule: str = Field(default="immediate", description="Upload schedule: immediate, hourly, daily, custom_interval")
    upload_interval_mins: int = Field(default=30, description="Delay between clip uploads in minutes")
    auto_publish_youtube: bool = Field(default=True, description="Auto-publish to YouTube Shorts")
    auto_publish_tiktok: bool = Field(default=True, description="Auto-publish to TikTok")
    auto_publish_instagram: bool = Field(default=False, description="Auto-publish to Instagram Reels")
    auto_publish_facebook: bool = Field(default=False, description="Auto-publish to Facebook Reels")
    telegram_bot_token: str = Field(default="", description="Telegram Bot Token for movie downloads")
    telegram_chat_id: str = Field(default="", description="Telegram Chat/Channel ID")
    telegram_auto_download: bool = Field(default=True, description="Auto-download movies sent to Telegram Bot")
    max_workers: int = Field(default=0, description="Concurrency level (0 = auto CPU thread count)")


class TelegramDownloadRequest(BaseModel):
    url_or_file_id: str = Field(..., description="Telegram message link, HTTP video URL, or file ID")
    filename: Optional[str] = Field(None, description="Optional custom filename")


class SettingsUpdateSchema(BaseModel):
    clip_length: Optional[int] = None
    video_codec: Optional[str] = None
    bitrate: Optional[str] = None
    resolution: Optional[str] = None
    fps: Optional[int] = None
    overlay_font: Optional[str] = None
    overlay_size: Optional[int] = None
    overlay_color: Optional[str] = None
    overlay_outline_color: Optional[str] = None
    overlay_outline_width: Optional[int] = None
    top_padding: Optional[int] = None
    show_movie_title: Optional[bool] = None
    upload_schedule: Optional[str] = None
    upload_interval_mins: Optional[int] = None
    auto_publish_youtube: Optional[bool] = None
    auto_publish_tiktok: Optional[bool] = None
    auto_publish_instagram: Optional[bool] = None
    auto_publish_facebook: Optional[bool] = None
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    telegram_auto_download: Optional[bool] = None
    max_workers: Optional[int] = None


class SystemLogSchema(BaseModel):
    id: int
    timestamp: datetime
    level: str
    category: str
    message: str
    details: Optional[str] = None

    class Config:
        from_attributes = True
