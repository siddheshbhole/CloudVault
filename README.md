# CloudVault

> **Zero-Knowledge Cloud File Storage with Dynamic Segmentation, Authenticated AES-256-GCM Encryption, and Seamless Reconstruction.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Storage-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Overview

**CloudVault** safeguards sensitive user data across untrusted cloud storage environments. Instead of storing entire raw files in the cloud, CloudVault divides each file into verified **1 MiB chunks**, encrypts every block individually with **AES-256-GCM** using fresh 96-bit nonces, stores the encrypted artifacts in private cloud object buckets, and deterministically reconstructs files byte-for-byte upon download with cryptographic integrity verification.

```
[ User File ] ──► [ 1 MiB Segmentation ] ──► [ AES-256-GCM Encrypt + Nonce ] ──► [ Supabase Storage ]
                                                                                         ▲
                                                                                         │ (Metadata & RLS)
                                                                                [ Supabase PostgreSQL ]
```

---

## 🛠️ Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Vite, Lucide Icons, Vanilla CSS | Splash intro animation, drag-and-drop upload, profile management, and dashboard |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, Pydantic | High-performance asynchronous REST API, streaming uploads, and orchestration |
| **Cryptography** | `cryptography` (AES-256-GCM, SHA-256) | Block cipher encryption, 128-bit authentication tags, and checksum validation |
| **Authentication** | Supabase Auth (JWT & Bearer Tokens) | Secure user registration, credential login, guest sessions, and token verification |
| **Database** | Supabase PostgreSQL + Row Level Security (RLS) | Per-user ownership rules, file metadata tracking, block index, and nonces |
| **Cloud Storage** | Supabase Private Storage Buckets | Encrypted ciphertext chunk storage (`cloudvault-blocks`) |

---

## 🔐 Core Architecture & Security Pipeline

| Step | Mechanism | Cryptographic / Technical Detail |
| :--- | :--- | :--- |
| **1. Ingestion & Split** | File Segmentation | Streamed into memory in 1,048,576-byte (1 MiB) sequential blocks |
| **2. Authenticated Encryption** | AES-256-GCM (AEAD) | Each chunk gets a unique 96-bit CSPRNG nonce; produces ciphertext + 16-byte tag |
| **3. Cloud Object Storage** | Isolated Block Vault | Ciphertext uploaded to private `cloudvault-blocks` bucket under user-isolated paths |
| **4. Metadata & Security** | PostgreSQL + RLS | Records chunk order, size, nonce, SHA-256, and links to authenticated user UUID |
| **5. Integrity Reconstruction** | Verified Streaming | Validates block tags & sequential indices; stream decrypts and returns original file |

---

## 🚀 Quickstart Guide

### 1. Database & Storage Setup (Supabase)
1. Open your Supabase Dashboard **SQL Editor**.
2. Run [`database/schema.sql`](file:///c:/Users/Siddhesh/Desktop/cloud-mini-project/database/schema.sql) (creates `files` and `file_blocks` tables).
3. Run [`database/indexes.sql`](file:///c:/Users/Siddhesh/Desktop/cloud-mini-project/database/indexes.sql) (adds performance indices).
4. Run [`database/policies.sql`](file:///c:/Users/Siddhesh/Desktop/cloud-mini-project/database/policies.sql) (configures Row Level Security).
5. In **Storage**, create a private bucket named **`cloudvault-blocks`** (`Public bucket = OFF`).

### 2. Environment Configuration

#### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and replace placeholders with your credentials:
```ini
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=8000
FRONTEND_ORIGIN=http://localhost:5173

# Supabase Project Credentials (Keep private - never commit real keys)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-or-secret-key
SUPABASE_BUCKET=cloudvault-blocks

# AES-256 32-Byte Master Key (Base64-encoded)
CLOUDVAULT_MASTER_KEY_B64=your-base64-32byte-master-key
```

> **Tip**: Generate a secure 32-byte master key with:
> ```bash
> python -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
> ```

#### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```ini
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 💻 Running Locally

### Backend (FastAPI)
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **API Base:** `http://127.0.0.1:8000`
- **Swagger Docs:** `http://127.0.0.1:8000/docs`

### Frontend (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
- **Web App:** `http://localhost:5173`

---

## 🧪 Testing & Verification

Run the automated backend test suite to verify segmentation boundaries, AES-GCM tag validation, and tampering rejection:
```powershell
cd backend
.\.venv\Scripts\pytest -v
```
Verifies segmentation, multi-chunk boundaries, AES-256-GCM authentication, and tampered ciphertext rejection.
