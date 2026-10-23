from fastapi import APIRouter, Depends, UploadFile, File, status
from uuid import UUID
from typing import List
from app.api.dependencies import get_current_user_id
from app.schemas.file import FileResponse, FileDetailResponse
from app.services.file_service import FileService
from app.repositories.storage_repository import StorageRepository
from app.repositories.metadata_repository import MetadataRepository
from app.services.segmentation_service import SegmentationService
from app.services.encryption_service import EncryptionService
from app.services.reconstruction_service import ReconstructionService

router = APIRouter(prefix="/files", tags=["Files"])

# Shared service instances
_storage = StorageRepository()
_metadata = MetadataRepository()
_segmentation = SegmentationService()
_encryption = EncryptionService()
_reconstruction = ReconstructionService(_encryption)
_file_service = FileService(_storage, _metadata, _segmentation, _encryption, _reconstruction)

def get_file_service() -> FileService:
    return _file_service

@router.post("", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    owner_id: UUID = Depends(get_current_user_id),
    service: FileService = Depends(get_file_service)
):
    return await service.upload_file(file, owner_id)

@router.get("", response_model=List[FileResponse])
def list_files(
    owner_id: UUID = Depends(get_current_user_id),
    service: FileService = Depends(get_file_service)
):
    return service.list_user_files(owner_id)

@router.get("/{file_id}", response_model=FileDetailResponse)
def get_file(
    file_id: UUID,
    owner_id: UUID = Depends(get_current_user_id),
    service: FileService = Depends(get_file_service)
):
    return service.get_file_detail(file_id, owner_id)

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: UUID,
    owner_id: UUID = Depends(get_current_user_id),
    service: FileService = Depends(get_file_service)
):
    service.delete_file(file_id, owner_id)
    return None
