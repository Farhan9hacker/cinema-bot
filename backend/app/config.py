import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application Settings loaded from Environment Variables or .env file."""
    
    PROJECT_NAME: str = "ShortForge"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database & Redis
    DATABASE_URL: str = "postgresql+asyncpg://shortforge:shortforge_pass@postgres:5432/shortforge"
    REDIS_URL: str = "redis://redis:6379/0"

    # Directory Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    INPUT_DIR: str = os.getenv("INPUT_DIR", str(Path(__file__).resolve().parent.parent.parent / "input"))
    PROCESSING_DIR: str = os.getenv("PROCESSING_DIR", str(Path(__file__).resolve().parent.parent.parent / "processing"))
    OUTPUT_DIR: str = os.getenv("OUTPUT_DIR", str(Path(__file__).resolve().parent.parent.parent / "output"))
    ARCHIVE_DIR: str = os.getenv("ARCHIVE_DIR", str(Path(__file__).resolve().parent.parent.parent / "archive"))
    LOGS_DIR: str = os.getenv("LOGS_DIR", str(Path(__file__).resolve().parent.parent.parent / "logs"))
    FONTS_DIR: str = os.getenv("FONTS_DIR", str(Path(__file__).resolve().parent.parent.parent / "fonts"))

    # Processing Defaults
    DEFAULT_CLIP_LENGTH: int = 90
    DEFAULT_VIDEO_CODEC: str = "h264"
    DEFAULT_AUDIO_CODEC: str = "aac"
    DEFAULT_BITRATE: str = "6M"
    DEFAULT_FPS: int = 30
    DEFAULT_RESOLUTION: str = "1080x1920"
    
    # Text Overlay Defaults
    DEFAULT_OVERLAY_FONT: str = "DejaVuSans-Bold.ttf"
    DEFAULT_OVERLAY_SIZE: int = 54
    DEFAULT_OVERLAY_COLOR: str = "white"
    DEFAULT_OVERLAY_OUTLINE_COLOR: str = "black"
    DEFAULT_OVERLAY_OUTLINE_WIDTH: int = 4
    DEFAULT_TOP_PADDING: int = 120
    
    # System Safety
    SAFE_DISK_FREE_GB: float = 5.0
    MAX_WORKERS: int = 0  # 0 = auto-calculate based on os.cpu_count()

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
