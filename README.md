# ShortForge 🎬⚡

**ShortForge** is a production-ready, Dockerized web application and automated processing pipeline that continuously monitors an input folder for long-form videos and automatically converts them into vertical 9:16 short-form clips (for YouTube Shorts, TikTok, and Instagram Reels) complete with professional text overlays.

---

## 🚀 Key Features

- **Continuous Directory Monitoring**: Automatically detects new video files added to `input/` and moves them through `processing/` to `archive/`.
- **Automatic 9:16 Vertical Transcoding**: Crops landscape videos into high-quality 1080x1920 vertical format with centered subject framing and smooth background blur padding using FFmpeg.
- **Dynamic Text Overlay**: Draws high-contrast white text with bold black outline ("MOVIE NAME \n\n PART X") placed cleanly within Shorts UI safe area boundaries.
- **Multiprocessing Worker Tuning**: Automatically selects optimal Celery transcode concurrency based on available CPU threads (e.g. 12 CPU threads).
- **Interactive Dark Mode Web Dashboard**: Live CPU, RAM, and Disk space gauges, active rendering progress bar, live ETA, upload queue management, and system log viewer.
- **Dynamic Settings & Live Visualizer**: Adjust clip segment length (default 90s), codec (H.264 / H.265), bitrate, font styling, overlay position, and top padding on the fly.
- **Fault Tolerance & Auto-Recovery**: Retries on FFmpeg failures, pauses queue automatically if disk space drops below safety thresholds, and auto-resumes unfinished jobs upon reboot.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Operating System** | Ubuntu 24.04 LTS (Dockerized) |
| **Language** | Python 3.12 |
| **Backend Framework**| FastAPI (Async Engine) |
| **Task Queue** | Redis + Celery |
| **Database** | PostgreSQL 16 (SQLAlchemy 2.0 Async) |
| **Video Engine** | FFmpeg & FFprobe |
| **Frontend** | React 18 + Vite + TailwindCSS (Dark Mode) |
| **Reverse Proxy** | Nginx |
| **Orchestration** | Docker Compose |

---

## 📂 File & Directory Structure

```
d:\cinema\
├── input/                  # Watched folder for incoming long videos
├── processing/             # Active video processing stage
├── output/                 # Rendered 9:16 vertical short clips
├── archive/                # Completed original long videos
├── logs/                   # System & execution logs
├── fonts/                  # TrueType/OpenType fonts for text overlay
├── database/               # Database initialization scripts
├── config/                 # Configurations
├── backend/
│   ├── app/
│   │   ├── api/            # REST API endpoints (videos, queue, system, settings, logs)
│   │   ├── models/         # SQLAlchemy DB models (Video, Clip, Setting, SystemLog)
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── services/       # FFmpeg transcode engine, folder watcher & sys info
│   │   ├── worker/         # Celery worker application & background tasks
│   │   ├── config.py       # Application settings & environment variables
│   │   ├── database.py     # Database session lifecycle
│   │   └── main.py         # FastAPI application entrypoint
│   ├── tests/              # Pytest backend test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/                # React components & pages
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── nginx/
│   └── nginx.conf          # Main reverse proxy configuration
├── docker-compose.yml
├── .env.example
├── pytest.ini
└── README.md
```

---

## ⚙️ System Requirements & Deployment

### Hardware & Software Prerequisites
- **Ubuntu 24.04 LTS** (or Docker Desktop on Linux/Windows/macOS)
- **Docker** 24.0+ & **Docker Compose** v2.20+
- Minimum 4 CPU Threads / 8GB RAM (Optimized for 12 CPU Threads / 64GB RAM)

---

## 📦 Quickstart Installation Guide

### 1. Clone & Setup Project
```bash
git clone https://github.com/your-org/shortforge.git
cd shortforge
cp .env.example .env
```

### 2. Launch Stack with Docker Compose
```bash
docker-compose up -d --build
```

### 3. Verify Container Status
```bash
docker-compose ps
```

The system will start all 6 microservices:
1. `shortforge_nginx` (Port 80)
2. `shortforge_frontend`
3. `shortforge_backend` (Port 8000)
4. `shortforge_worker` (Celery transcode worker)
5. `shortforge_redis` (Port 6379)
6. `shortforge_postgres` (Port 5432)

Open your web browser and navigate to:
```
http://localhost
```

---

## 🎬 How It Works

1. **Ingestion**: Drop any long-form `.mp4`, `.mkv`, or `.mov` file into the `input/` folder (or click **Upload Video** on the dashboard).
2. **Detection & Split**: Watchdog detects the file, moves it to `processing/`, reads duration via `ffprobe`, and calculates 90-second segment boundaries (e.g. 2h 30m movie = 100 clips).
3. **9:16 Transcoding & Overlay**: Celery workers split and convert each clip into 1080x1920 MP4 (H.264/AAC, 30 FPS, Faststart) with centered title overlay ("MOVIE NAME \n\n PART X").
4. **Output & Archive**: Rendered clips appear in `output/`, and the original video is moved to `archive/`.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/system/status` | `GET` | Retrieve CPU, RAM, Disk usage, active video progress & ETA |
| `/api/videos` | `GET` | List all ingested videos with status filtering |
| `/api/videos/upload` | `POST` | Upload long video file directly via Multipart Form |
| `/api/videos/{id}/start` | `POST` | Start or restart processing for a video |
| `/api/videos/{id}/pause` | `POST` | Pause video processing |
| `/api/videos/{id}/resume` | `POST` | Resume video processing |
| `/api/videos/{id}/cancel` | `POST` | Cancel video processing |
| `/api/queue/status` | `GET` | View render queue summary and active clip segments |
| `/api/queue/retry/{id}` | `POST` | Reset retry count and re-queue failed segment |
| `/api/settings` | `GET / PUT` | Read or update transcoding and overlay settings |
| `/api/logs` | `GET` | Retrieve system event logs |
| `/api/logs/download` | `GET` | Download raw plain text log file |

---

## 🧪 Running Unit Tests

To run the backend test suite:

```bash
cd backend
python -m pytest
```

---

## 📜 License

Production Ready. Built with FastAPI, React, Celery, Redis, PostgreSQL, and FFmpeg.
