"""File upload API router."""

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.services.file import (
    FileService,
    FileSizeExceededError,
    FileUploadError,
    InvalidFileTypeError,
)

router = APIRouter(prefix="/api/files", tags=["files"])


class FileUploadResponse(BaseModel):
    """Response model for file upload."""

    url: str
    filename: str
    message: str


class FileDeleteResponse(BaseModel):
    """Response model for file deletion."""

    success: bool
    message: str


class FileDeleteRequest(BaseModel):
    """Request model for file deletion."""

    url: str


@router.post(
    "/upload",
    response_model=FileUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a file",
    description="Upload an image file. Supported formats: JPG, JPEG, PNG, GIF, WEBP, BMP. Max size: 10MB.",
)
async def upload_file(file: UploadFile = File(...)) -> FileUploadResponse:
    """Upload a file and return its URL.

    Args:
        file: The file to upload (multipart/form-data)

    Returns:
        FileUploadResponse with the URL to access the uploaded file

    Raises:
        HTTPException: If file upload fails
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    file_service = FileService()

    try:
        # Read file content
        content = await file.read()

        # Upload file
        url = await file_service.upload_file(
            file_content=content,
            filename=file.filename,
            content_type=file.content_type,
        )

        return FileUploadResponse(
            url=url,
            filename=file.filename,
            message="File uploaded successfully",
        )

    except InvalidFileTypeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except FileSizeExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=str(e),
        )
    except FileUploadError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.delete(
    "/delete",
    response_model=FileDeleteResponse,
    summary="Delete a file",
    description="Delete a previously uploaded file by its URL.",
)
async def delete_file(request: FileDeleteRequest) -> FileDeleteResponse:
    """Delete a file by its URL.

    Args:
        request: Request containing the file URL to delete

    Returns:
        FileDeleteResponse indicating success or failure
    """
    file_service = FileService()
    deleted = await file_service.delete_file(request.url)

    if deleted:
        return FileDeleteResponse(
            success=True,
            message="File deleted successfully",
        )
    else:
        return FileDeleteResponse(
            success=False,
            message="File not found or already deleted",
        )
