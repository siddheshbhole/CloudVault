# CloudVault

> **Secure Cloud File Storage with File Segmentation, Encryption (AES-256-GCM), and Reconstruction**

CloudVault is a cloud computing project built with **React + Vite**, **Python + FastAPI**, **Supabase Storage**, and **Supabase PostgreSQL**.

---

## 🚀 Key Features
- **File Segmentation**: Divides uploaded files into configurable ordered chunks (1 MiB default).
- **Client-Separated Authenticated Encryption**: AES-256-GCM authenticated encryption applied to every block with a fresh 96-bit nonce before cloud upload.
- **Private Cloud Storage**: Encrypted objects stored in a private Supabase Storage bucket (`cloudvault-blocks`).
- **PostgreSQL Metadata**: File and block ordering, nonces, and integrity checksums recorded in Supabase PostgreSQL with Row Level Security (RLS).
- **Atomic-Style Flow & Integrity Check**: Only marks file status `ready` after every block upload succeeds. Reconstructs byte-for-byte upon download and prevents corrupted or tampered reads.
- **Clean White-First UI**: Minimal, accessible interface with file status indicators, storage metrics, and drag-and-drop.

---

## 📋 Supabase Configuration (Connecting Your Supabase)

To connect your Supabase project:

### 1. Database Setup
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Run the SQL statements in [`database/schema.sql`](file:///c:/Users/Siddhesh/Desktop/cloud-mini-project/database/schema.sql) to create the `files` and `file_blocks` tables.
3. Run [`database/indexes.sql`](file:///c:/Users/Siddhesh/Desktop/cloud-mini-project/database/indexes.sql) to create performance indexes.
4. Run [`database/policies.sql`](file:///c:/Users/Siddhesh/Desktop/cloud-mini-project/database/policies.sql) to apply Row Level Security.

### 2. Storage Bucket Setup
1. In Supabase Dashboard, navigate to **Storage**.
2. Create a new bucket named **`cloudvault-blocks`**.
3. Keep the bucket **Private** (Public bucket = OFF).

### 3. Backend Environment (`backend/.env`)
Create `backend/.env` (or copy from [`backend/.env.example`](file:///c:/Users/Siddhesh/Desktop/cloud-mini-project/backend/.env.example)) and fill in your Supabase project credentials:

```ini
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=8000
FRONTEND_ORIGIN=http://localhost:5173

# Put your real Supabase credentials here:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-or-secret-key
SUPABASE_BUCKET=cloudvault-blocks

# AES-256 32-byte encryption key (Base64)
CLOUDVAULT_MASTER_KEY_B64=zK9zV7aG4s8PqW1X2y3Z4a5B6c7D8e9F0g1H2i3J4k5=
```

---

## 💻 Running Locally

### 1. Backend (FastAPI)
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Endpoint: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend (React + Vite)
```powershell
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 Running Automated Tests
```powershell
cd backend
.\.venv\Scripts\pytest -v
```
Verifies segmentation, multi-chunk boundaries, AES-256-GCM authentication, and tampered ciphertext rejection.
