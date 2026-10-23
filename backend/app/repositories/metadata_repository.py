from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from supabase import create_client, Client
from app.core.config import settings
from app.models.constants import FileStatus

class MetadataRepository:
    def __init__(self, client: Optional[Client] = None):
        self.client = client
        # In-memory store when Supabase placeholder URL is present
        self._mock_files: Dict[str, dict] = {}
        self._mock_blocks: Dict[str, List[dict]] = {}

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

    def create_file_record(self, file_data: dict) -> dict:
        client = self._get_client()
        now = datetime.now(timezone.utc).isoformat()
        file_data["created_at"] = now
        file_data["updated_at"] = now

        if client:
            res = client.table("files").insert(file_data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            raise RuntimeError("Failed to insert file record to Supabase")
        else:
            fid = str(file_data["id"])
            self._mock_files[fid] = file_data
            self._mock_blocks[fid] = []
            return file_data

    def update_file_status(self, file_id: UUID, status: FileStatus) -> Optional[dict]:
        client = self._get_client()
        now = datetime.now(timezone.utc).isoformat()
        if client:
            res = client.table("files").update({"status": status.value, "updated_at": now}).eq("id", str(file_id)).execute()
            return res.data[0] if res.data else None
        else:
            fid = str(file_id)
            if fid in self._mock_files:
                self._mock_files[fid]["status"] = status.value
                self._mock_files[fid]["updated_at"] = now
                return self._mock_files[fid]
            return None

    def insert_block_metadata(self, block_data: dict) -> dict:
        client = self._get_client()
        now = datetime.now(timezone.utc).isoformat()
        block_data["created_at"] = now
        if client:
            res = client.table("file_blocks").insert(block_data).execute()
            return res.data[0] if res.data else block_data
        else:
            fid = str(block_data["file_id"])
            if fid in self._mock_blocks:
                self._mock_blocks[fid].append(block_data)
            return block_data

    def get_file_by_id(self, file_id: UUID, owner_id: UUID) -> Optional[dict]:
        client = self._get_client()
        if client:
            res = client.table("files").select("*").eq("id", str(file_id)).eq("owner_id", str(owner_id)).execute()
            return res.data[0] if res.data else None
        else:
            rec = self._mock_files.get(str(file_id))
            if rec and str(rec.get("owner_id")) == str(owner_id):
                return rec
            return None

    def list_files_by_owner(self, owner_id: UUID) -> List[dict]:
        client = self._get_client()
        if client:
            res = client.table("files").select("*").eq("owner_id", str(owner_id)).order("created_at", desc=True).execute()
            return res.data
        else:
            records = [f for f in self._mock_files.values() if str(f.get("owner_id")) == str(owner_id)]
            return sorted(records, key=lambda x: x.get("created_at", ""), reverse=True)

    def get_blocks_for_file(self, file_id: UUID) -> List[dict]:
        client = self._get_client()
        if client:
            res = client.table("file_blocks").select("*").eq("file_id", str(file_id)).order("block_index", desc=False).execute()
            return res.data
        else:
            blocks = self._mock_blocks.get(str(file_id), [])
            return sorted(blocks, key=lambda b: b.get("block_index", 0))

    def delete_file_record(self, file_id: UUID, owner_id: UUID) -> bool:
        client = self._get_client()
        if client:
            client.table("files").delete().eq("id", str(file_id)).eq("owner_id", str(owner_id)).execute()
            return True
        else:
            fid = str(file_id)
            if fid in self._mock_files and str(self._mock_files[fid].get("owner_id")) == str(owner_id):
                del self._mock_files[fid]
                self._mock_blocks.pop(fid, None)
                return True
            return False
