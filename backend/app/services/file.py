"""File upload service for handling image uploads."""

import os
import uuid
from datetime import datetime
from pathlib import Path

import aiofiles

from app.core.config import get_settings


class FileUploadError(Exception):
    """Raised when file upload fails."""

    pass


class FileSizeExceededError(Exception):
    """Raised when file size exceeds the maximum allowed size."""

    pass


class InvalidFileTypeError(Exception):
    """Raised when file type is not allowed."""

    pass


class FileService:
    """Service for handling file uploads."""

    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
    ALLOWED_CONTENT_TYPES = {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
    }

    def __init__(self):
        """Initialize file service."""
        self.settings = get_settings()
        self.upload_dir = Path(self.settings.upload_dir)
        self._ensure_upload_dir()

    def _ensure_upload_dir(self) -> None:
        """Ensure upload directory exists."""
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def _validate_file_extension(self, filename: str) -> str:
        """Validate file extension and return it.

        Args:
            filename: Original filename

        Returns:
            File extension (lowercase)

        Raises:
            InvalidFileTypeError: If file extension is not allowed
        """
        ext = Path(filename).suffix.lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise InvalidFileTypeError(
                f"File type '{ext}' is not allowed. "
                f"Allowed types: {', '.join(self.ALLOWED_EXTENSIONS)}"
            )
        return ext

    def _validate_content_type(self, content_type: str | None) -> None:
        """Validate content type.

        Args:
            content_type: MIME type of the file

        Raises:
            InvalidFileTypeError: If content type is not allowed
        """
        if content_type and content_type not in self.ALLOWED_CONTENT_TYPES:
            raise InvalidFileTypeError(
                f"Content type '{content_type}' is not allowed. "
                f"Allowed types: {', '.join(self.ALLOWED_CONTENT_TYPES)}"
            )

    def _validate_file_size(self, size: int) -> None:
        """Validate file size.

        Args:
            size: File size in bytes

        Raises:
            FileSizeExceededError: If file size exceeds maximum
        """
        if size > self.settings.max_upload_size:
            max_mb = self.settings.max_upload_size / (1024 * 1024)
            raise FileSizeExceededError(
                f"File size exceeds maximum allowed size of {max_mb:.1f}MB"
            )

    def _generate_unique_filename(self, original_filename: str) -> str:
        """Generate a unique filename.

        Args:
            original_filename: Original filename

        Returns:
            Unique filename with timestamp and UUID
        """
        ext = Path(original_filename).suffix.lower()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = uuid.uuid4().hex[:8]
        return f"{timestamp}_{unique_id}{ext}"

    async def upload_file(
        self,
        file_content: bytes,
        filename: str,
        content_type: str | None = None,
    ) -> str:
        """Upload a file and return its URL.

        Args:
            file_content: File content as bytes
            filename: Original filename
            content_type: MIME type of the file

        Returns:
            URL path to access the uploaded file (e.g., /uploads/xxx.jpg)

        Raises:
            InvalidFileTypeError: If file type is not allowed
            FileSizeExceededError: If file size exceeds maximum
            FileUploadError: If upload fails
        """
        # Validate file
        self._validate_file_extension(filename)
        self._validate_content_type(content_type)
        self._validate_file_size(len(file_content))

        # Generate unique filename
        unique_filename = self._generate_unique_filename(filename)
        file_path = self.upload_dir / unique_filename

        try:
            # Write file asynchronously
            async with aiofiles.open(file_path, "wb") as f:
                await f.write(file_content)

            # Return URL path
            return f"/uploads/{unique_filename}"

        except Exception as e:
            # Clean up partial file if exists
            if file_path.exists():
                file_path.unlink()
            raise FileUploadError(f"Failed to upload file: {str(e)}") from e

    async def delete_file(self, file_url: str) -> bool:
        """Delete a file by its URL.

        Args:
            file_url: URL path of the file (e.g., /uploads/xxx.jpg)

        Returns:
            True if file was deleted, False if file didn't exist
        """
        # Extract filename from URL
        if file_url.startswith("/uploads/"):
            filename = file_url[len("/uploads/"):]
        else:
            filename = file_url

        file_path = self.upload_dir / filename

        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def get_file_path(self, file_url: str) -> Path | None:
        """Get the full file path from URL.

        Args:
            file_url: URL path of the file

        Returns:
            Full file path or None if file doesn't exist
        """
        if file_url.startswith("/uploads/"):
            filename = file_url[len("/uploads/"):]
        else:
            filename = file_url

        file_path = self.upload_dir / filename

        if file_path.exists():
            return file_path
        return None
