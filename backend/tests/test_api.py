import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


@pytest.mark.asyncio
async def test_system_status(async_client: AsyncClient):
    response = await async_client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert "cpu_percent" in data
    assert "ram_percent" in data
    assert "disk_free_gb" in data


@pytest.mark.asyncio
async def test_get_settings(async_client: AsyncClient):
    response = await async_client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert data["clip_length"] == 90
    assert data["video_codec"] == "h264"


@pytest.mark.asyncio
async def test_update_settings(async_client: AsyncClient):
    payload = {"clip_length": 60, "video_codec": "h265", "top_padding": 150}
    response = await async_client.put("/api/settings", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["clip_length"] == 60
    assert data["video_codec"] == "h265"
    assert data["top_padding"] == 150


@pytest.mark.asyncio
async def test_queue_status(async_client: AsyncClient):
    response = await async_client.get("/api/queue/status")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "active_items" in data


@pytest.mark.asyncio
async def test_logs_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/logs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
