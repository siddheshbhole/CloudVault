from typing import Generator, BinaryIO
import io

class SegmentationService:
    def __init__(self, chunk_size: int = 1048576):
        self.chunk_size = chunk_size

    def segment_bytes(self, data: bytes) -> Generator[tuple[int, bytes], None, None]:
        """
        Segments raw bytes into chunks.
        Yields (block_index, chunk_bytes).
        Handles empty data by returning 0 blocks.
        """
        if not data:
            return

        total_len = len(data)
        block_index = 0
        for i in range(0, total_len, self.chunk_size):
            yield (block_index, data[i:i + self.chunk_size])
            block_index += 1

    def segment_stream(self, stream: BinaryIO) -> Generator[tuple[int, bytes], None, None]:
        """
        Reads a binary stream in chunk_size segments.
        Yields (block_index, chunk_bytes).
        """
        block_index = 0
        while True:
            chunk = stream.read(self.chunk_size)
            if not chunk:
                break
            yield (block_index, chunk)
            block_index += 1

    def calculate_block_count(self, total_size: int) -> int:
        if total_size <= 0:
            return 0
        return (total_size + self.chunk_size - 1) // self.chunk_size
