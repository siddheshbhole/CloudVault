from uuid import UUID, uuid4
from typing import List, Generator, Optional
import io
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.models.constants import FileStatus, ENCRYPTION_VERSION
from app.repositories.storage_repository import StorageRepository
from app.repositories.metadata_repository import MetadataRepository
from app.services.segmentation_service import SegmentationService
from app.services.encryption_service import EncryptionService
from app.services.reconstruction_service import ReconstructionService

class FileService:
    def __init__(
        self,
        storage_repo: StorageRepository,
        metadata_repo: MetadataRepository,
        segmentation_svc: SegmentationService,
        encryption_svc: EncryptionService,
        reconstruction_svc: ReconstructionService
    ):
        self.storage = storage_repo
        self.metadata = metadata_repo
        self.segmentation = segmentation_svc
        self.encryption = encryption_svc
        self.reconstruction = reconstruction_svc

    async def upload_file(self, file: UploadFile, owner_id: UUID) -> dict:
        content = await file.read()
        file_size = len(content)

        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES} bytes."
            )

        file_id = uuid4()
        chunk_size = settings.CHUNK_SIZE_BYTES
        block_count = self.segmentation.calculate_block_count(file_size)

        # 1. Insert file record with pending status
        file_record = {
            "id": str(file_id),
            "owner_id": str(owner_id),
            "original_name": file.filename or "unnamed_file",
            "content_type": file.content_type or "application/octet-stream",
            "original_size": file_size,
            "chunk_size": chunk_size,
            "block_count": block_count,
            "status": FileStatus.PENDING.value,
            "encryption_version": ENCRYPTION_VERSION
        }
        self.metadata.create_file_record(file_record)
        self.metadata.update_file_status(file_id, FileStatus.UPLOADING)

        uploaded_paths = []
        try:
            # 2. Segment and encrypt each block
            for block_index, chunk_data in self.segmentation.segment_bytes(content):
                ciphertext, nonce_b64, checksum = self.encryption.encrypt_block(chunk_data)

                # Storage path format: {owner_id}/{file_id}/block_{index:06d}.bin
                object_path = f"{owner_id}/{file_id}/block_{block_index:06d}.bin"
                
                # Upload encrypted object
                self.storage.upload_block(object_path, ciphertext)
                uploaded_paths.append(object_path)

                # Insert block metadata
                block_meta = {
                    "id": str(uuid4()),
                    "file_id": str(file_id),
                    "block_index": block_index,
                    "object_path": object_path,
                    "plaintext_size": len(chunk_data),
                    "ciphertext_size": len(ciphertext),
                    "nonce": nonce_b64,
                    "checksum": checksum
                }
                self.metadata.insert_block_metadata(block_meta)

            # 3. Mark file ready only after all blocks succeeded
            updated = self.metadata.update_file_status(file_id, FileStatus.READY)
            return updated or file_record

        except Exception as e:
            # Fail safely and attempt cleanup of uploaded blocks
            self.metadata.update_file_status(file_id, FileStatus.FAILED)
            if uploaded_paths:
                self.storage.delete_blocks(uploaded_paths)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed during encryption or storage: {str(e)}"
            )

    def list_user_files(self, owner_id: UUID) -> List[dict]:
        return self.metadata.list_files_by_owner(owner_id)

    def get_file_detail(self, file_id: UUID, owner_id: UUID) -> dict:
        file_rec = self.metadata.get_file_by_id(file_id, owner_id)
        if not file_rec:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found or access denied")
        blocks = self.metadata.get_blocks_for_file(file_id)
        file_rec["blocks"] = blocks
        return file_rec

    def reconstruct_file_stream(self, file_id: UUID, owner_id: UUID) -> tuple[dict, Generator[bytes, None, None]]:
        file_rec = self.metadata.get_file_by_id(file_id, owner_id)
        if not file_rec:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        if file_rec.get("status") != FileStatus.READY.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is not in ready state for download")

        blocks = self.metadata.get_blocks_for_file(file_id)
        if len(blocks) != file_rec.get("block_count", 0):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Missing blocks for file")

        stream = self.reconstruction.reconstruct_stream(
            blocks_metadata=blocks,
            download_block_func=self.storage.download_block
        )
        return file_rec, stream

    def delete_file(self, file_id: UUID, owner_id: UUID) -> bool:
        file_rec = self.metadata.get_file_by_id(file_id, owner_id)
        if not file_rec:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        self.metadata.update_file_status(file_id, FileStatus.DELETING)
        blocks = self.metadata.get_blocks_for_file(file_id)
        object_paths = [b["object_path"] for b in blocks if "object_path" in b]

        if object_paths:
            self.storage.delete_blocks(object_paths)

        return self.metadata.delete_file_record(file_id, owner_id)
