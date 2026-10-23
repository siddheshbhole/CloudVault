from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.constants import FileStatus

class FileMetadataBase(BaseModel):
    original_name: str
    content_type: Optional[str] = None
    original_size: int
    chunk_size: int
    block_count: int

class FileCreate(FileMetadataBase):
    pass

class FileResponse(FileMetadataBase):
    id: UUID
    owner_id: UUID
    status: FileStatus
    encryption_version: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BlockMetadata(BaseModel):
    id: Optional[UUID] = None
    file_id: UUID
    block_index: int
    object_path: str
    plaintext_size: int
    ciphertext_size: int
    nonce: str
    auth_tag: Optional[str] = None
    checksum: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FileDetailResponse(FileResponse):
    blocks: List[BlockMetadata] = []
