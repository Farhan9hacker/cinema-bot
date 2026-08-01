from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Video(Base):
    """Represents a long-form video registered in ShortForge."""
    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    original_path: Mapped[str] = mapped_column(String(512), nullable=False)
    processing_path: Mapped[str] = mapped_column(String(512), nullable=False)
    archive_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    resolution: Mapped[str] = mapped_column(String(50), default="1920x1080")
    fps: Mapped[float] = mapped_column(Float, default=30.0)
    total_clips: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)  # pending, processing, paused, completed, failed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    clips: Mapped[List["Clip"]] = relationship("Clip", back_populates="video", cascade="all, delete-orphan")


class Clip(Base):
    """Represents a generated short segment (clip)."""
    __tablename__ = "clips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    video_id: Mapped[int] = mapped_column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    part_number: Mapped[int] = mapped_column(Integer, nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    output_path: Mapped[str] = mapped_column(String(512), nullable=False)
    start_time: Mapped[float] = mapped_column(Float, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="queued", index=True)  # queued, rendering, completed, failed, uploaded
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    upload_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    video: Mapped["Video"] = relationship("Video", back_populates="clips")


class Setting(Base):
    """Dynamic configuration settings stored in DB."""
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    value: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class SystemLog(Base):
    """Application and pipeline event logs."""
    __tablename__ = "system_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    level: Mapped[str] = mapped_column(String(20), default="INFO", index=True)
    category: Mapped[str] = mapped_column(String(50), default="system", index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
