from typing import List, Generator
from app.schemas.file import BlockMetadata
from app.services.encryption_service import EncryptionService

class ReconstructionService:
    def __init__(self, encryption_service: EncryptionService):
        self.encryption_service = encryption_service

    def reconstruct_stream(
        self,
        blocks_metadata: List[dict],
        download_block_func
    ) -> Generator[bytes, None, None]:
        """
        Takes sorted blocks metadata, retrieves ciphertext for each block,
        decrypts with authenticated tag validation, and yields plaintext chunks in order.
        """
        # Ensure ordered strictly by block_index
        sorted_blocks = sorted(blocks_metadata, key=lambda b: b["block_index"])

        for expected_idx, block in enumerate(sorted_blocks):
            if block["block_index"] != expected_idx:
                raise ValueError(f"Block order corrupted: expected {expected_idx}, got {block['block_index']}")

            ciphertext = download_block_func(block["object_path"])
            plaintext = self.encryption_service.decrypt_block(ciphertext, block["nonce"])
            yield plaintext
