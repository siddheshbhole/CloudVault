import pytest
from app.services.segmentation_service import SegmentationService

def test_segmentation_small_file():
    service = SegmentationService(chunk_size=10)
    data = b"hello"
    chunks = list(service.segment_bytes(data))
    assert len(chunks) == 1
    assert chunks[0][0] == 0
    assert chunks[0][1] == b"hello"

def test_segmentation_multi_chunk():
    service = SegmentationService(chunk_size=4)
    data = b"1234567890"  # 10 bytes -> 4, 4, 2
    chunks = list(service.segment_bytes(data))
    assert len(chunks) == 3
    assert chunks[0] == (0, b"1234")
    assert chunks[1] == (1, b"5678")
    assert chunks[2] == (2, b"90")

def test_segmentation_empty():
    service = SegmentationService(chunk_size=10)
    chunks = list(service.segment_bytes(b""))
    assert len(chunks) == 0
    assert service.calculate_block_count(0) == 0
