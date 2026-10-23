from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from uuid import UUID
import urllib.parse
from app.api.dependencies import get_current_user_id
from app.services.file_service import FileService
from app.api.routes.files import get_file_service

router = APIRouter(prefix="/files", tags=["Downloads"])

@router.get("/{file_id}/download")
def download_file(
    file_id: UUID,
    owner_id: UUID = Depends(get_current_user_id),
    service: FileService = Depends(get_file_service)
):
    file_rec, stream_generator = service.reconstruct_file_stream(file_id, owner_id)
    
    filename = file_rec.get("original_name", "downloaded_file")
    # URL encode filename for Content-Disposition header
    encoded_filename = urllib.parse.quote(filename)
    content_type = file_rec.get("content_type") or "application/octet-stream"

    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
        "Content-Length": str(file_rec.get("original_size", 0))
    }

    return StreamingResponse(stream_generator, media_type=content_type, headers=headers)
