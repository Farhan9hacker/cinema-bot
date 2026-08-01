import os
import psutil
from typing import Dict, Any


def get_system_metrics() -> Dict[str, Any]:
    """Retrieve system CPU, RAM, and Disk metrics."""
    cpu_percent = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    
    # Target directory for disk space checking
    try:
        disk = psutil.disk_usage("/")
    except Exception:
        disk = psutil.disk_usage(".")

    return {
        "cpu_percent": float(cpu_percent),
        "ram_percent": float(mem.percent),
        "ram_used_gb": round(mem.used / (1024 ** 3), 2),
        "ram_total_gb": round(mem.total / (1024 ** 3), 2),
        "disk_percent": float(disk.percent),
        "disk_free_gb": round(disk.free / (1024 ** 3), 2)
    }


def calculate_optimal_worker_count(custom_max_workers: int = 0) -> int:
    """Calculate optimal worker concurrency based on CPU thread count."""
    if custom_max_workers > 0:
        return custom_max_workers

    cpu_count = os.cpu_count() or 4
    # Video encoding is CPU intensive. Use min 2, max cpu_count // 2 or max 8 for optimal performance without choking CPU
    optimal = max(1, min(cpu_count, cpu_count // 2 if cpu_count >= 4 else cpu_count))
    return optimal
