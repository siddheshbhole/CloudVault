import io
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

class StorageRepository:
    def __init__(self, client: Optional[Client] = None, bucket_name: Optional[str] = None):
        self.bucket_name = bucket_name or settings.SUPABASE_BUCKET
        self.client = client
        self._mock_storage = {}  # In-memory mock storage fallback when Supabase credentials are placeholder

    def _get_client(self) -> Optional[Client]:
        if self.client:
            return self.client
        if (settings.SUPABASE_URL and not "example.supabase.co" in settings.SUPABASE_URL
            and settings.SUPABASE_SECRET_KEY and settings.SUPABASE_SECRET_KEY != "example-secret-key"):
            try:
                self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
                return self.client
            except Exception:
                pass
        return None

    def upload_block(self, object_path: str, data: bytes) -> str:
        """
        Uploads encrypted binary block to Supabase Storage.
        Falls back to safe in-memory storage if user has not entered real Supabase credentials yet.
        """
        client = self._get_client()
        if client:
            # Supabase storage upload
            res = client.storage.from_(self.bucket_name).upload(
                path=object_path,
                file=data,
                file_options={"content-type": "application/octet-stream", "upsert": "true"}
            )
            return object_path
        else:
            # Fallback mock for demo/development before Supabase is connected
            self._mock_storage[object_path] = data
            return object_path

    def download_block(self, object_path: str) -> bytes:
        """
        Downloads encrypted binary block from Supabase Storage.
        """
        client = self._get_client()
        if client:
            return client.storage.from_(self.bucket_name).download(object_path)
        else:
            if object_path in self._mock_storage:
                return self._mock_storage[object_path]
            raise FileNotFoundError(f"Block not found at {object_path}")

    def delete_blocks(self, object_paths: list[str]) -> bool:
        """
        Deletes a list of objects from Supabase Storage.
        """
        client = self._get_client()
        if client and object_paths:
            client.storage.from_(self.bucket_name).remove(object_paths)
            return True
        else:
            for path in object_paths:
                self._mock_storage.pop(path, None)
            return True
