from enum import Enum

class FileStatus(str, Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    READY = "ready"
    FAILED = "failed"
    DELETING = "deleting"

ENCRYPTION_VERSION = "AES-256-GCM-v1"
