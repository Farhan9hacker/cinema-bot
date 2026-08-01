import os
import psutil
import logging
from typing import Dict, Any

logger = logging.getLogger("shortforge.sys_info")


def get_system_metrics() -> Dict[str, Any]:
    """Retrieve system CPU, RAM, and Disk metrics cleanly."""
    try:
        cpu_percent = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory()
        
        # Disk usage check inside container or host mount
        disk_path = "/app" if os.path.exists("/app") else "."
        try:
            disk = psutil.disk_usage(disk_path)
        except Exception:
            disk = psutil.disk_usage("/")

        return {
            "cpu_percent": float(cpu_percent),
            "ram_percent": float(mem.percent),
            "ram_used_gb": round(mem.used / (1024 ** 3), 2),
            "ram_total_gb": round(mem.total / (1024 ** 3), 2),
            "disk_percent": float(disk.percent),
            "disk_free_gb": round(disk.free / (1024 ** 3), 2)
        }
    except Exception as e:
        logger.warning(f"Error fetching psutil system metrics: {e}")
        return {
            "cpu_percent": 0.0,
            "ram_percent": 0.0,
            "ram_used_gb": 0.0,
            "ram_total_gb": 64.0,
            "disk_percent": 0.0,
            "disk_free_gb": 200.0
        }


def calculate_optimal_worker_count(custom_max_workers: int = 0) -> int:
    """Calculate optimal worker concurrency based on CPU thread count."""
    if custom_max_workers > 0:
        return custom_max_workers

    cpu_count = os.cpu_count() or 4
    optimal = max(1, min(cpu_count, cpu_count // 2 if cpu_count >= 4 else cpu_count))
    return optimal
