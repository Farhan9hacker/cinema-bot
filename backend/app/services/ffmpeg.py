import json
import math
import os
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger("shortforge.ffmpeg")


class FFmpegService:
    """Service to handle video metadata extraction and 9:16 clip transcoding via FFmpeg."""

    @staticmethod
    def get_metadata(video_path: str) -> Dict[str, Any]:
        """Extract metadata from video file using ffprobe."""
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at: {video_path}")

        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            video_path
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)

            format_info = data.get("format", {})
            duration = float(format_info.get("duration", 0.0))

            video_stream = next(
                (s for s in data.get("streams", []) if s.get("codec_type") == "video"),
                {}
            )

            width = int(video_stream.get("width", 1920))
            height = int(video_stream.get("height", 1080))
            resolution = f"{width}x{height}"

            # Calculate FPS
            fps_eval = video_stream.get("r_frame_rate", "30/1")
            if "/" in fps_eval:
                num, den = fps_eval.split("/")
                fps = round(float(num) / float(den), 2) if float(den) > 0 else 30.0
            else:
                fps = float(fps_eval) if fps_eval else 30.0

            codec = video_stream.get("codec_name", "h264")

            return {
                "filename": os.path.basename(video_path),
                "duration": duration,
                "resolution": resolution,
                "width": width,
                "height": height,
                "fps": fps,
                "codec": codec
            }
        except (subprocess.SubprocessError, json.JSONDecodeError, ValueError) as e:
            logger.warning(f"ffprobe failed or not available for {video_path}: {e}. Returning fallback metadata.")
            # Fallback estimation for missing ffprobe or unparseable video
            file_size = os.path.getsize(video_path) if os.path.exists(video_path) else 0
            estimated_duration = max(1.0, float(file_size) / (1024 * 1024 * 2))  # Rough estimate
            return {
                "filename": os.path.basename(video_path),
                "duration": round(estimated_duration, 2),
                "resolution": "1920x1080",
                "width": 1920,
                "height": 1080,
                "fps": 30.0,
                "codec": "h264"
            }

    @staticmethod
    def calculate_clip_segments(duration_seconds: float, clip_length: int = 90) -> Tuple[int, list]:
        """Calculate total clips and (start_time, end_time) ranges for a video."""
        if duration_seconds <= 0:
            return 0, []

        clip_length = max(10, clip_length)
        total_clips = math.ceil(duration_seconds / clip_length)
        segments = []

        for i in range(total_clips):
            start = i * clip_length
            end = min(duration_seconds, (i + 1) * clip_length)
            segments.append((start, end))

        return total_clips, segments

    @staticmethod
    def format_title_text(filename: str) -> str:
        """Sanitize and format title text for FFmpeg drawtext filter."""
        clean_name = Path(filename).stem
        # Replace underscores and hyphens with spaces
        clean_name = clean_name.replace("_", " ").replace("-", " ").strip().upper()
        # Escape special characters for FFmpeg drawtext
        clean_name = clean_name.replace(":", "\\:").replace("'", "").replace('"', '')
        return clean_name

    @classmethod
    def render_clip(
        cls,
        input_path: str,
        output_path: str,
        start_time: float,
        end_time: float,
        movie_title: str,
        part_number: int,
        codec: str = "h264",
        bitrate: str = "6M",
        fps: int = 30,
        resolution: str = "1080x1920",
        font_path: Optional[str] = None,
        font_size: int = 54,
        font_color: str = "white",
        outline_color: str = "black",
        outline_width: int = 4,
        top_padding: int = 120,
        show_movie_title: bool = True
    ) -> bool:
        """
        Transcode a segment into a vertical 9:16 MP4 clip with top title overlay using FFmpeg.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        duration = end_time - start_time

        target_width, target_height = 1080, 1920
        if "x" in resolution:
            parts = resolution.split("x")
            target_width, target_height = int(parts[0]), int(parts[1])

        # Formatting titles
        title_text = cls.format_title_text(movie_title)
        part_text = f"PART {part_number}"
        if show_movie_title:
            full_overlay_text = f"{title_text}\n\n{part_text}"
        else:
            full_overlay_text = part_text

        # FFmpeg Video Filter chain:
        # Create blurred background + centered scaled foreground + top title overlay
        filter_complex = (
            f"[0:v]scale={target_width}:{target_height}:force_original_aspect_ratio=increase,"
            f"crop={target_width}:{target_height},boxblur=20:10[bg];"
            f"[0:v]scale={target_width}:{target_height}:force_original_aspect_ratio=decrease[fg];"
            f"[bg][fg]overlay=(W-w)/2:(H-h)/2[base];"
        )

        font_option = f":fontfile='{font_path}'" if font_path and os.path.exists(font_path) else ""
        
        # Text Overlay
        drawtext_filter = (
            f"[base]drawtext=text='{full_overlay_text}'{font_option}:"
            f"fontsize={font_size}:fontcolor={font_color}:"
            f"bordercolor={outline_color}:borderw={outline_width}:"
            f"x=(w-text_w)/2:y={top_padding}:line_spacing=15[outv]"
        )

        full_filter = filter_complex + drawtext_filter

        # Encoder selection
        encoder = "libx265" if codec.lower() in ["h265", "hevc"] else "libx264"

        cmd = [
            "ffmpeg",
            "-y",
            "-ss", f"{start_time:.2f}",
            "-i", input_path,
            "-t", f"{duration:.2f}",
            "-filter_complex", full_filter,
            "-map", "[outv]",
            "-map", "0:a?",  # Map audio if present
            "-c:v", encoder,
            "-b:v", bitrate,
            "-r", str(fps),
            "-c:a", "aac",
            "-b:a", "192k",
            "-preset", "fast",
            "-movflags", "+faststart",
            output_path
        ]

        logger.info(f"Executing FFmpeg render command for clip Part {part_number}: {' '.join(cmd)}")

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info(f"FFmpeg rendered clip Part {part_number} successfully to {output_path}")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg rendering failed for Part {part_number}: {e.stderr}")
            # Fallback simple command without complex filter if primary drawtext fails
            return cls._fallback_render(input_path, output_path, start_time, duration, encoder, bitrate, fps)
        except Exception as e:
            logger.error(f"Unexpected error rendering clip Part {part_number}: {e}")
            return False

    @staticmethod
    def _fallback_render(
        input_path: str,
        output_path: str,
        start_time: float,
        duration: float,
        encoder: str,
        bitrate: str,
        fps: int
    ) -> bool:
        """Fallback lightweight render if complex filter fails."""
        cmd = [
            "ffmpeg",
            "-y",
            "-ss", f"{start_time:.2f}",
            "-i", input_path,
            "-t", f"{duration:.2f}",
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
            "-c:v", encoder,
            "-b:v", bitrate,
            "-r", str(fps),
            "-c:a", "aac",
            "-preset", "fast",
            "-movflags", "+faststart",
            output_path
        ]
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            return True
        except Exception as e:
            logger.error(f"Fallback render failed: {e}")
            return False
