CloudVault --- Technical Architecture, Project Structure, Integration, and Implementation Plan
1. Agreed Technology Stack
  Layer                   Technology              Responsibility
  Frontend                React + Vite            User interface and
                                                  frontend build tooling

  Styling                 Plain CSS or CSS        Minimal white-first UI
                          Modules                 with restrained accent
                                                  color

  Icons                   Lucide React (optional) Consistent interface
                                                  icons

  Frontend API client     Native fetch or a     Calls the FastAPI
                          small API wrapper       backend

  Backend                 Python + FastAPI        API endpoints,
                                                  validation,
                                                  orchestration,
                                                  authorization

  ASGI server             Uvicorn                 Runs FastAPI locally

  File processing         Python standard library Chunking, IDs,
                          (io, hashlib,       checksums and streaming
                          uuid) as appropriate  helpers

  Encryption              cryptography package  AES-256-GCM
                                                  authenticated
                                                  encryption

  Cloud object storage    Supabase Storage        Stores encrypted block
                                                  objects in a private
                                                  bucket

  Database                Supabase PostgreSQL     Stores file and block
                                                  metadata

  Supabase Python         supabase Python       Storage and database
  integration             client or authenticated operations
                          REST calls              

  Configuration           pydantic-settings +   Validated backend
                          environment variables   configuration

  Upload parsing          FastAPI UploadFile /  Multipart upload
                          python-multipart      handling

  Testing                 pytest, FastAPI       Unit and API tests
                          TestClient or HTTPX   

  API documentation       FastAPI OpenAPI docs    Interactive endpoint
                          (/docs)               testing

  Version control         Git + GitHub            Code history and
                                                  collaboration

  Optional frontend       Vercel or another       Public frontend
  hosting                 static host             deployment, if required

  Local development       Python virtual          Isolated backend and
                          environment +           frontend dependencies
                      Node.js/npm             
Current cloud choice: Supabase Storage + Supabase PostgreSQL. No
AWS, Azure, Google Cloud, CloudFront, CDN, or EC2 integration in the
agreed implementation.

Assignment caveat: The original assignment names AWS S3, Azure Blob
Storage, or Google Cloud Storage and mentions CDN/HTTPS. Supabase and
the no-CDN scope are changes to the stated brief. Confirm these changes
with the instructor. Do not describe Supabase Storage as S3 or claim CDN
integration.
2. Repository Layout
Keep frontend, backend, database setup, documentation, and tests
separate. The following structure is the target layout; files can be
added gradually as features are implemented.
CloudVault/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── AppHeader.jsx
│   │   │   ├── FileDropzone.jsx
│   │   │   ├── FileTable.jsx
│   │   │   ├── FileStatusBadge.jsx
│   │   │   ├── UploadProgress.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── FilesPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── services/
│   │   │   └── apiClient.js
│   │   ├── hooks/
│   │   │   └── useFiles.js
│   │   ├── utils/
│   │   │   ├── formatBytes.js
│   │   │   └── errorMessages.js
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   └── components.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── health.py
│   │   │   │   ├── files.py
│   │   │   │   └── downloads.py
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── logging_config.py
│   │   │   └── exceptions.py
│   │   ├── schemas/
│   │   │   ├── file.py
│   │   │   └── common.py
│   │   ├── services/
│   │   │   ├── segmentation_service.py
│   │   │   ├── encryption_service.py
│   │   │   ├── reconstruction_service.py
│   │   │   ├── file_service.py
│   │   │   └── cleanup_service.py
│   │   ├── repositories/
│   │   │   ├── storage_repository.py
│   │   │   └── metadata_repository.py
│   │   ├── models/
│   │   │   └── constants.py
│   │   ├── main.py
│   │   └── __init__.py
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── test_segmentation.py
│   │   │   ├── test_encryption.py
│   │   │   └── test_reconstruction.py
│   │   ├── integration/
│   │   │   ├── test_storage_repository.py
│   │   │   └── test_file_lifecycle.py
│   │   └── api/
│   │       └── test_file_routes.py
│   ├── .env.example
│   ├── .gitignore
│   └── requirements.txt
│
├── database/
│   ├── schema.sql
│   ├── policies.sql
│   ├── indexes.sql
│   └── README.md
│
├── docs/
│   ├── problem-statement.md
│   ├── architecture.md
│   ├── api-documentation.md
│   ├── security-notes.md
│   ├── test-plan.md
│   └── deployment-and-cleanup.md
│
├── scripts/
│   ├── dev.ps1
│   └── cleanup_test_data.py
│
├── .gitignore
└── README.md
Do not create every file as an empty placeholder in one go. Build the
skeleton first, then implement and test one module at a time. models/
can remain small; Supabase is the database, so an ORM is not required
for the initial version.
3. Responsibilities and Connections
3.1 Frontend
The frontend must: - Present a simple white-first UI with neutral gray
borders/text and one restrained accent color. - Provide upload, list,
download, and delete interactions. - Display filename, size, block
count, creation time, and status. - Show progress and understandable
error messages. - Call the backend API; do not directly upload plaintext
or call privileged Supabase operations from the browser. - Avoid placing
secrets in VITE_* variables. - Treat all browser-side validation as
convenience only; the backend must validate again.

frontend/src/services/apiClient.js should own the API base URL and
common request/error handling. Components should call this client rather
than duplicating raw fetch logic.
3.2 Backend API
backend/app/main.py: - Creates the FastAPI app. - Registers route
modules. - Configures CORS for the exact local frontend origin during
development. - Adds request size limits and consistent exception
handlers where appropriate. - Exposes a health endpoint.

backend/app/api/routes/files.py: - Handles upload initiation, listing,
and deletion. - Delegates work to file_service.py. - Does not contain
encryption or storage implementation details directly.

backend/app/api/routes/downloads.py: - Authorizes the file owner. -
Delegates retrieval, verification, decryption, and reconstruction to the
service layer. - Returns a streaming response or temporary output file
where practical; avoid holding multiple copies of large files in RAM.

backend/app/api/dependencies.py: - Extracts and validates the
authenticated user identity. - Uses a verified Supabase access token or
another explicitly configured auth approach. - Never trusts a
client-supplied user_id without verifying it.
3.3 Services
- segmentation_service.py: splits bytes or streams into indexed
  chunks using a configurable chunk size (initially 1 MiB); handles
  empty and small files explicitly.
- encryption_service.py: encrypts/decrypts each chunk using
  AES-256-GCM; generates a fresh nonce for each encryption; verifies
  authentication before returning plaintext.
- reconstruction_service.py: checks expected block count/order and
  joins or streams verified plaintext blocks.
- file_service.py: orchestrates validation, pending metadata
  creation, block processing, upload, status changes, downloads, and
  deletion.
- cleanup_service.py: handles orphaned block objects and metadata
  after failed or interrupted operations.
- storage_repository.py: wraps Supabase Storage
  upload/download/delete calls and normalizes errors.
- metadata_repository.py: handles metadata reads/writes in
  PostgreSQL and keeps SQL/query details out of route handlers.
3.4 Database and Storage
- Supabase Storage bucket: private, for example cloudvault-blocks.
- Supabase PostgreSQL: file metadata and block metadata only.
- Use separate storage paths per user and file, such as
  user_id/file_id/block_000001.bin. Do not use the original filename
  as the only path component.
- A file's status should move through states such as pending,
  uploading, ready, failed, and deleting.
- Mark a file ready only after every block upload and metadata write
  succeeds.
- For failure, delete uploaded blocks where possible and mark the
  record failed; provide a cleanup routine for orphaned objects.
- Apply Row Level Security and owner checks to metadata. Storage
  policies should restrict reads/writes/deletes to the intended owner
  or server-side flow.
- Never make the bucket public to simplify downloads.
- If the backend uses a Supabase secret/service-role key, keep it only
  on the server, protect it carefully, and enforce user authorization
  in backend logic. Prefer a least-privilege design where practical.
4. Data Model
Use two principal tables.
4.1 files
Suggested columns:
  Column                  Type                    Notes
  id                    UUID, primary key       Generated file ID

  owner_id              UUID                    Authenticated user's
                                                  Supabase Auth ID;
                                                  foreign key where
                                                  appropriate

  original_name         Text                    Display name; sanitize
                                                  on output and never use
                                                  as trusted path

  content_type          Text, nullable          Informational; do not
                                                  trust it for security

  original_size         Bigint                  Original byte length

  chunk_size            Integer                 Configured plaintext
                                                  block size

  block_count           Integer                 Number of encrypted
                                                  blocks

  status                Text or enum            pending, uploading,
                                                  ready, failed,
                                                  deleting

  encryption_version    Text                    Identifies
                                                  format/algorithm
                                                  version, not the secret
                                                  key

  created_at            Timestamptz             Creation timestamp

  updated_at            Timestamptz             Last status/metadata
                                              update
4.2 file_blocks
Suggested columns:
  Column                  Type                    Notes
  id                    UUID, primary key       Block record ID

  file_id               UUID, foreign key       Parent file

  block_index           Integer                 Zero-based or
                                                  one-based; choose one
                                                  convention and document
                                                  it

  object_path           Text, unique            Supabase Storage path

  plaintext_size        Integer                 Size before encryption

  ciphertext_size       Integer                 Size stored

  nonce                 Text/bytea              Non-secret nonce
                                                  required for decryption

  auth_tag              Text/bytea, optional    Store separately only
                                                  if not included in
                                                  ciphertext format

  checksum              Text, optional          Integrity/diagnostic
                                                  checksum; authenticated
                                                  encryption remains
                                                  essential
  created_at            Timestamptz             Creation timestamp
Add a unique constraint on (file_id, block_index) and indexes for
owner_id, file_id, and common list/status queries. Store nonces and
format metadata with the block, but never store the encryption key in
either table.
4.3 Database consistency
Supabase Storage object operations and PostgreSQL transactions are not
one atomic transaction. The backend must use a staged workflow: 1.
Insert file metadata with pending. 2. Upload encrypted blocks. 3.
Insert block metadata. 4. Mark the file ready only when the expected
block count is present. 5. If a step fails, mark failed and attempt
cleanup. 6. Include an admin/developer cleanup path for orphaned objects
and incomplete records.

Where appropriate, a database RPC/function can group metadata updates
into a PostgreSQL transaction, but it cannot make the Storage API upload
atomic with the database transaction.
5. API Contract
Use a versioned prefix such as /api/v1.
  Method                  Endpoint                             Purpose
  GET                   /api/v1/health                     Health check; no
                                                               secrets or internal
                                                               diagnostics

  POST                  /api/v1/files                      Upload a file;
                                                               validate, segment,
                                                               encrypt and store

  GET                   /api/v1/files                      List the current user's
                                                               files

  GET                   /api/v1/files/{file_id}            Retrieve metadata for
                                                               an authorized file

  GET                   /api/v1/files/{file_id}/download   Fetch, authenticate,
                                                               decrypt and reconstruct

  DELETE                /api/v1/files/{file_id}            Delete authorized file
                                                           blocks and metadata
Optional later endpoints: - GET /api/v1/files/{file_id}/status -
POST /api/v1/files/{file_id}/retry for a carefully designed retry
process. - Pagination query parameters for file lists.

Use consistent HTTP status codes and a stable error response shape, for
example
{ "detail": "Readable error message", "code": "FILE_NOT_FOUND" }.
Never return stack traces or secrets.
6. File Upload Workflow
1. Frontend submits multipart file data to FastAPI.
2. Backend verifies the user's token and ownership context.
3. Backend validates filename, size, configured type rules, and
   quota/limits.
4. Backend generates a UUID for the file and creates a pending
   metadata record.
5. Backend reads the file incrementally where possible; avoid
   unnecessary full-file copies.
6. Split plaintext into ordered chunks (initial target: 1 MiB).
7. Encrypt each chunk using AES-256-GCM with a unique nonce. Store the
   nonce and format/version metadata.
8. Upload each ciphertext object to the private Storage bucket.
9. Insert each block's metadata, including index and object path.
10. Verify the number of uploaded blocks matches the expected count.
11. Mark the file ready and return safe metadata to the frontend.
12. On failure, do not mark the file ready; attempt cleanup and record a
    safe failure state.
For very large files, design a streaming or staged-upload path rather
than loading the entire file into memory. Set request and per-file size
limits suitable for the chosen Supabase plan and API limits.
7. Download Workflow
1. Frontend requests a download for a file ID.
2. Backend authenticates the user and checks ownership before
   retrieving objects.
3. Backend checks that the file status is ready and block metadata is
   complete.
4. Fetch blocks in index order.
5. For each block, validate the expected metadata and decrypt with
   AES-GCM. Authentication failure must abort the download.
6. Reconstruct the original byte stream in order.
7. Return a download with a safe Content-Disposition filename.
8. Do not expose private Storage paths or long-lived signed URLs
   unnecessarily.
9. Log the outcome without logging file contents, tokens, or keys.
8. Encryption and Key Management
- Use the cryptography library's AES-GCM implementation with a
  256-bit key.
- Generate a unique 96-bit nonce for each encryption operation; never
  reuse a nonce with the same key.
- AES-GCM ciphertext can include the authentication tag in the
  serialized output. Pick one documented format and use it
  consistently.
- Store nonce and non-secret format metadata with the block. Do not
  store the key beside ciphertext.
- Do not hard-code keys or commit them to Git.
- Do not put keys in frontend code, browser storage, Supabase tables,
  or the same bucket as ciphertext.
- For a student prototype, use a server-side environment secret with
  clear limitations documented. For stronger user privacy, design a
  key derivation/wrapping model separately and do not claim end-to-end
  encryption unless keys never reach the server.
- If a key is lost, data may be unrecoverable; document
  backup/recovery behavior.
- Test wrong-key and modified-ciphertext behavior.
9. Authentication and Authorization
Recommended approach if the application needs per-user files: 1. Enable
Supabase Auth. 2. Frontend signs the user in using Supabase's
public/publishable key. 3. Frontend sends the access token to FastAPI
using Authorization: Bearer .... 4. Backend verifies the token using a
trusted method and derives the user ID from the verified claims. 5.
Backend checks ownership for every file operation. 6. Apply RLS to
metadata tables and policies to Storage objects as defense in depth. 7.
Never accept a caller-provided owner_id as proof of identity. 8. Never
expose a Supabase secret/service-role key to the frontend.

If authentication is deferred in the first local prototype, label it as
a single-user development mode and do not deploy it publicly or claim
multi-user isolation.
10. Environment Configuration
Backend .env.example
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=8000
FRONTEND_ORIGIN=http://localhost:5173

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=replace_with_server_only_secret
SUPABASE_BUCKET=cloudvault-blocks

# Use a securely generated 32-byte key encoded as base64, or use a
# dedicated key-management approach. Never commit the real key.
CLOUDVAULT_MASTER_KEY_B64=replace_me
MAX_UPLOAD_SIZE_BYTES=104857600
CHUNK_SIZE_BYTES=1048576
Use the correct key type shown in the current Supabase dashboard. Do not
assume legacy service_role and newer secret keys are interchangeable
in every context; follow current Supabase documentation and keep
privileged credentials server-side.
Frontend .env.example
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
Do not put a Supabase secret/service-role key or encryption key in any
VITE_* variable. A Supabase publishable/anon key is designed for
browser use only when paired with correct RLS policies.
Git ignore
At minimum, ignore: - .env and other real secret files - .venv/ -
node_modules/ - __pycache__/ - .pytest_cache/ - .coverage -
generated upload/temp files - local logs and editor-specific files where
appropriate

Commit .env.example, never real .env files.
11. Installation and Local Development
Backend (Windows PowerShell)
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install fastapi "uvicorn[standard]" python-multipart supabase cryptography pydantic-settings pytest httpx
pip freeze > requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
Use the requirements.txt produced and reviewed by the project. Pin
dependencies before final submission and avoid unnecessary packages.
Frontend
cd frontend
npm install
npm run dev
Expected local addresses: - Frontend: http://localhost:5173 - Backend:
http://127.0.0.1:8000 - API docs: http://127.0.0.1:8000/docs

Configure CORS only for the expected development origin. Do not use a
wildcard origin with credentials in production.
12. UI Design Rules
- White background and neutral light-gray surfaces.
- One accent color (for example, muted blue or indigo).
- Dark readable text, consistent spacing, simple borders, and subtle
  shadows only where helpful.
- Keep the main dashboard focused: title, upload action, storage/file
  summary, file table, and status.
- Include loading, empty, success, failure, and confirmation states.
- Make keyboard focus visible and use accessible labels.
- Avoid unnecessary gradients, neon colors, excessive cards, and
  distracting animation.
- Do not display a fabricated storage capacity or security score. Show
  only values available from real metadata.
13. Performance and Optimization
Memory and file handling
- Begin with a 1 MiB chunk size as a tunable default; benchmark 256
  KiB, 1 MiB, and 4 MiB with representative files before finalizing.
- Avoid reading the whole file into memory multiple times.
- Use streaming/incremental reads and writes where the libraries and
  storage API support them.
- Avoid loading every ciphertext block and every plaintext block
  simultaneously for large downloads.
- Use a temporary file or streaming response when appropriate; delete
  temporary data in finally cleanup paths.
- Limit concurrent block uploads to a small configurable number to
  avoid memory spikes, rate limits, and too many requests.
Network and storage
- Reuse the Supabase client instead of creating one for every block.
- Use stable object paths and idempotent retry behavior.
- Retry transient network failures with bounded exponential backoff;
  do not retry permanent authorization or validation errors
  indefinitely.
- Avoid duplicate metadata writes on retry; use unique constraints and
  explicit upload states.
- Check Supabase plan limits, file-size limits, request limits,
  storage quotas, and pricing before selecting maximum file sizes.
- Do not use database queries in a loop where a batched query can
  safely retrieve the same metadata.
Database
- Add indexes for owner/file lookup and block ordering.
- Enforce uniqueness on (file_id, block_index).
- Paginate file listing.
- Store file content in Storage, not PostgreSQL.
- Keep metadata small and validate state transitions.
- Consider a database function for grouped metadata changes, while
  recognizing that Storage uploads cannot share the same PostgreSQL
  transaction.
Frontend
- Keep API calls in one client module.
- Prevent duplicate submissions while uploads are running.
- Show upload progress only when the implementation can measure it
  accurately.
- Avoid fetching all metadata on every render; refresh only after
  relevant operations.
- Use pagination if file lists grow.
- Do not load complete files into browser memory unless required.
Security and operations
- Set upload size limits and request timeouts.
- Use strict CORS configuration.
- Do not log tokens, keys, plaintext file data, or sensitive URLs.
- Keep the Storage bucket private.
- Verify user ownership for every operation.
- Configure cloud spending/usage alerts where available; alerts are
  not a hard guarantee against charges.
- Delete test objects and unused resources after the demonstration.
14. Testing Plan
Unit tests
- Files smaller than one chunk.
- Files exactly one chunk long.
- Files slightly larger than one chunk.
- Empty file behavior.
- Reconstruction preserves byte-for-byte content.
- Each encryption uses a unique nonce.
- Correct key decrypts; wrong key fails.
- Modified ciphertext or authentication tag fails verification.
- Block order is enforced.
Integration tests
- Upload encrypted objects to a dedicated test bucket.
- Persist and retrieve metadata.
- Download and reconstruct the original file.
- Delete objects and metadata.
- Simulate a failure after some blocks upload and verify cleanup.
- Ensure a file is not listed as ready before all blocks exist.
Authorization tests
- User A cannot list, download, or delete User B's files.
- Missing/invalid tokens are rejected.
- Changing a file ID does not bypass ownership checks.
- Storage policies do not allow anonymous access to private objects.
Manual demonstration
1. Upload a small text file.
2. Upload a file large enough to create multiple blocks.
3. Show block count and metadata in the dashboard/database.
4. Show that stored objects are ciphertext, not the original plaintext.
5. Download and compare the reconstructed file with the original.
6. Attempt a tampered-ciphertext test in a controlled test environment
   and show that authentication fails.
7. Demonstrate access-control behavior if authentication is
   implemented.
8. Delete a test file and verify object cleanup.
15. Implementation Milestones
1. Repository skeleton: create the separate frontend, backend,
   database, docs, and tests directories.
2. Backend baseline: health endpoint, configuration loading, CORS,
   and /docs.
3. Local file logic: segmentation and reconstruction with unit
   tests, no cloud integration yet.
4. Encryption: authenticated encryption, key configuration,
   serialization format, and failure tests.
5. Supabase setup: private bucket, schema, indexes, RLS and Storage
   policies.
6. Storage adapter: upload/download/delete encrypted objects.
7. Metadata adapter: create, list, update, and delete file/block
   metadata.
8. Lifecycle orchestration: pending/uploading/ready/failed/deleting
   states and cleanup.
9. Frontend: minimal white dashboard connected to the API.
10. Authentication and authorization: token validation and per-user
    ownership checks before public deployment.
11. Integration and security testing: errors, interrupted uploads,
    tampering, and cross-user access.
12. Documentation and demo: setup guide, screenshots, test results,
    known limitations, and cleanup procedure.
16. Definition of Done
The project is ready for demonstration when: - Frontend and backend
start independently using documented commands. - Supabase configuration
is externalized and no real secrets are committed. - Files are segmented
and encrypted before upload. - Encrypted blocks and metadata are stored
in their intended locations. - Downloads are authorized,
authenticated/decrypted, and reconstructed byte-for-byte. - Tampering is
detected and invalid output is not returned. - Partial failures are
handled without marking incomplete files as ready. - File
listing/deletion and the minimal UI work. - Unit/integration tests and
the demo procedure are documented. - The instructor has confirmed the
Supabase substitution and omission of CDN/CloudFront, if those original
requirements are mandatory.