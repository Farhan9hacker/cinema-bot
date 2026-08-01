import pytest
from app.services.ffmpeg import FFmpegService


def test_calculate_clip_segments_exact():
    # 2h 30m = 9000 seconds -> 100 clips of 90s each
    duration = 9000.0
    total_clips, segments = FFmpegService.calculate_clip_segments(duration, clip_length=90)
    assert total_clips == 100
    assert len(segments) == 100
    assert segments[0] == (0, 90)
    assert segments[-1] == (8910, 9000)


def test_calculate_clip_segments_partial():
    # 100 seconds -> 2 clips (90s + 10s)
    duration = 100.0
    total_clips, segments = FFmpegService.calculate_clip_segments(duration, clip_length=90)
    assert total_clips == 2
    assert segments[0] == (0, 90)
    assert segments[1] == (90, 100)


def test_format_title_text():
    title = "my_favorite_movie_2026.mp4"
    formatted = FFmpegService.format_title_text(title)
    assert formatted == "MY FAVORITE MOVIE 2026"
