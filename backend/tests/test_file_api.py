"""Tests for file upload API."""

import io
import os
from pathlib import Path

import pytest
from fastapi import status
from httpx import AsyncClient

from app.core.config import get_settings
from app.main import app


@pytest.fixture
def test_image_content() -> bytes:
    """Create a minimal valid PNG image for testing."""
    # Minimal 1x1 pixel PNG
    return (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00"
        b"\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00"
        b"\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
    )


@pytest.fixture
def cleanup_uploads():
    """Cleanup uploaded files after test."""
    uploaded_files = []
    yield uploaded_files
    # Cleanup
    settings = get_settings()
    for filename in uploaded_files:
        file_path = Path(settings.upload_dir) / filename
        if file_path.exists():
            file_path.unlink()


class TestFileUpload:
    """Test cases for file upload endpoint."""

    @pytest.mark.asyncio
    async def test_upload_valid_image(self, test_image_content, cleanup_uploads):
        """Test uploading a valid image file."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            files = {"file": ("test_image.png", io.BytesIO(test_image_content), "image/png")}
            response = await client.post("/api/files/upload", files=files)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "url" in data
        assert data["url"].startswith("/uploads/")
        assert data["url"].endswith(".png")
        assert data["filename"] == "test_image.png"
        assert data["message"] == "File uploaded successfully"

        # Track for cleanup
        cleanup_uploads.append(data["url"].split("/")[-1])

    @pytest.mark.asyncio
    async def test_upload_invalid_file_type(self):
        """Test uploading a file with invalid extension."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            files = {"file": ("test.txt", io.BytesIO(b"hello world"), "text/plain")}
            response = await client.post("/api/files/upload", files=files)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "not allowed" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_upload_file_too_large(self, monkeypatch):
        """Test uploading a file that exceeds size limit."""
        # Temporarily set a very small max size
        settings = get_settings()
        original_max_size = settings.max_upload_size
        monkeypatch.setattr(settings, "max_upload_size", 10)  # 10 bytes

        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                # Create content larger than 10 bytes
                large_content = b"x" * 100
                files = {"file": ("large.png", io.BytesIO(large_content), "image/png")}
                response = await client.post("/api/files/upload", files=files)

            assert response.status_code == status.HTTP_413_CONTENT_TOO_LARGE
            assert "exceeds" in response.json()["detail"].lower()
        finally:
            monkeypatch.setattr(settings, "max_upload_size", original_max_size)

    @pytest.mark.asyncio
    async def test_upload_jpeg_image(self, cleanup_uploads):
        """Test uploading a JPEG image."""
        # Minimal valid JPEG (1x1 pixel)
        jpeg_content = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x7F, 0xFF,
            0xD9
        ])

        async with AsyncClient(app=app, base_url="http://test") as client:
            files = {"file": ("photo.jpg", io.BytesIO(jpeg_content), "image/jpeg")}
            response = await client.post("/api/files/upload", files=files)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["url"].endswith(".jpg")

        cleanup_uploads.append(data["url"].split("/")[-1])


class TestFileDelete:
    """Test cases for file delete endpoint."""

    @pytest.mark.asyncio
    async def test_delete_existing_file(self, test_image_content):
        """Test deleting an existing file."""
        # First upload a file
        async with AsyncClient(app=app, base_url="http://test") as client:
            files = {"file": ("to_delete.png", io.BytesIO(test_image_content), "image/png")}
            upload_response = await client.post("/api/files/upload", files=files)

        assert upload_response.status_code == status.HTTP_201_CREATED
        file_url = upload_response.json()["url"]

        # Now delete it
        async with AsyncClient(app=app, base_url="http://test") as client:
            delete_response = await client.request(
                "DELETE",
                "/api/files/delete",
                json={"url": file_url},
            )

        assert delete_response.status_code == status.HTTP_200_OK
        data = delete_response.json()
        assert data["success"] is True
        assert "deleted successfully" in data["message"]

    @pytest.mark.asyncio
    async def test_delete_nonexistent_file(self):
        """Test deleting a file that doesn't exist."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.request(
                "DELETE",
                "/api/files/delete",
                json={"url": "/uploads/nonexistent_file.png"},
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is False
        assert "not found" in data["message"]
