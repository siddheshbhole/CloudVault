CloudVault --- Problem Statement, Scope, Requirements, and Expected Outcome
1. Project Overview
Project name: CloudVault
Project type: Cloud Computing Mini-Project
Working title: Secure Cloud File Storage with File Segmentation,
Encryption, and Reconstruction
Chosen implementation: React + Vite frontend, Python + FastAPI
backend, Supabase Storage, and Supabase PostgreSQL.

CloudVault is a web application that allows a user to upload a file,
divide it into smaller blocks, encrypt the blocks before cloud storage,
and later download, verify, decrypt, and reconstruct the original file.
Supabase Storage will store the encrypted blocks, while Supabase
PostgreSQL will store file and block metadata.

The frontend will provide a minimal, white-based interface for uploading
files, viewing stored files and their status, and downloading or
deleting files. The backend will perform validation, segmentation,
encryption/decryption, reconstruction, authorization checks, and
communication with Supabase.
Assignment alignment note: The supplied assignment names Amazon
S3, Azure Blob Storage, or Google Cloud Storage and also mentions a
CDN/HTTPS demonstration. This implementation uses Supabase instead and
intentionally omits a CDN/CloudFront. Confirm with the instructor that
Supabase is accepted as the cloud-storage provider and that the CDN
requirement may be omitted before final submission. Do not claim that
CloudVault satisfies those provider-specific requirements unless the
instructor approves the substitution.

2. Problem Statement
Users need a convenient way to store and retrieve files through a
cloud-connected application. A basic upload-and-download solution does
not, by itself, demonstrate file segmentation, application-level
encryption, block metadata management, or reconstruction of the original
file.

The problem is to design and implement a cloud-based file-storage
application that segments files into smaller blocks, encrypts the data
before sending it to cloud storage, records the information needed to
retrieve the blocks in the correct order, and securely reconstructs the
original file during download. The application must integrate a frontend
with a Python backend and Supabase Storage/PostgreSQL, handle errors and
unauthorized requests safely, and provide a simple user interface
suitable for a college demonstration.
3. Objectives
1. Build a working web interface for uploading, listing, downloading,
   and deleting files.
2. Divide each uploaded file into configurable, ordered blocks.
3. Encrypt file data before it is stored in Supabase Storage.
4. Store encrypted blocks in a private Supabase Storage bucket.
5. Store file metadata and block ordering information in Supabase
   PostgreSQL.
6. Retrieve blocks, verify their integrity, decrypt them, and
   reconstruct the original file.
7. Enforce authentication/authorization and prevent users from
   accessing files they do not own.
8. Handle invalid files, failed uploads, missing blocks, and decryption
   errors without silently producing corrupted output.
9. Demonstrate and test the complete upload-to-download lifecycle.
10. Document the architecture, setup, APIs, database schema, security
    decisions, test cases, and limitations.
4. Scope: What Must Be Implemented
4.1 Required functional features
- File selection and validation
  - Allow the user to select a file through the frontend.
  - Validate file size and any configured file-type restrictions on
    the backend.
  - Use configurable limits and return understandable errors.
- File segmentation
  - Split the input into fixed-size chunks, initially targeting 1
    MiB per plaintext chunk.
  - Support a smaller final chunk.
  - Assign each block a stable index and identifier.
  - Define behavior for empty files and files smaller than one
    block.
- Encryption
  - Use authenticated encryption such as AES-256-GCM through
    Python's cryptography package.
  - Generate a unique nonce for every encryption operation.
  - Preserve the nonce, authentication tag (if not included in the
    ciphertext representation), algorithm/version metadata, and
    other required decryption information.
  - Keep encryption keys separate from stored ciphertext and source
    control.
- Cloud storage
  - Upload encrypted blocks to a private Supabase Storage
    bucket.
  - Use deterministic, collision-resistant object paths that do not
    expose sensitive original filenames unnecessarily.
  - Never make the bucket public just to make downloads work.
- Metadata
  - Record the file owner, original filename (as metadata, safely
    handled), original size, content type if needed, block size,
    block count, status, timestamps, and encryption format/version.
  - Record each block's index, object path, ciphertext size,
    nonce/tag information as needed, and integrity metadata.
  - Avoid storing file contents in PostgreSQL rows.
- Download and reconstruction
  - Authorize the request before fetching any block.
  - Retrieve blocks in index order.
  - Verify authentication/integrity and decrypt each block.
  - Reassemble the plaintext chunks in order and return the original
    file as a download.
  - Fail safely if a block is missing, out of order, modified, or
    cannot be authenticated.
- File management
  - List only files the authenticated user is permitted to see.
  - Show status, original size, number of blocks, and upload date.
  - Allow deletion of a file's storage objects and related metadata.
  - Handle partial failures and cleanup of orphaned objects.
- Status and error feedback
  - Show upload/download progress where practical.
  - Show clear success and failure states.
  - Do not expose secret keys, stack traces, signed URLs, or
    sensitive backend details to the browser.
4.2 User interface requirements
- Simple, clean, white-first design.
- Minimal neutral colors with one restrained accent color.
- Readable typography, generous spacing, clear buttons, and accessible
  contrast.
- Core screens: dashboard/file list, upload interaction, file
  details/status, and error/empty states.
- Avoid unnecessary animations, decorative complexity, or features
  unrelated to the assignment.
- Keep security-critical behavior in the backend, not in frontend-only
  checks.
4.3 Cloud and database requirements
- Supabase project with a private Storage bucket.
- Supabase PostgreSQL tables for file records and block records.
- Row Level Security (RLS) and authorization policies where
  applicable.
- Backend-only access to privileged Supabase credentials.
- A documented method for local development configuration.
- No CDN or CloudFront in the current agreed scope.
- Static hosting is optional and separate from the core file-storage
  workflow; hosting the application publicly is not required to prove
  local development functionality.
5. Out of Scope for the Initial Version
To keep the project manageable and reduce bottlenecks, the initial
release does not require:
- AWS S3, Azure Blob Storage, or Google Cloud Storage integration.
- CloudFront or any other CDN.
- EC2 or a continuously running cloud VM.
- Multi-region replication or distributed consensus.
- Public sharing links.
- End-to-end key recovery, organization-level key management, or
  enterprise compliance features.
- Deduplication, compression, malware scanning, version history, or
  collaborative editing.
- A claim that segmentation alone improves security or that block
  storage is equivalent to HDFS.
- A guarantee of zero cloud charges. Supabase plan limits and pricing
  must be checked before use.
These can be considered later only if required by the instructor or if
time permits.
6. Expected Outcome
At completion, CloudVault should demonstrate this end-to-end workflow:
1. A user selects a file in the frontend.
2. The frontend sends it to the FastAPI backend over the local
   development connection or HTTPS in deployment.
3. The backend validates the request and creates a file record in a
   pending state.
4. The backend segments the file, encrypts each block, and uploads
   encrypted objects to the private Supabase Storage bucket.
5. The backend records block metadata and marks the file as ready only
   after all required blocks and metadata are successfully stored.
6. The file list displays the stored file and its block count.
7. When the user requests a download, the backend verifies ownership,
   fetches the blocks in order, authenticates/decrypts them,
   reconstructs the original file, and returns it.
8. Tests verify that the downloaded file matches the original
   byte-for-byte and that altered ciphertext or an incorrect key fails
   authentication.
9. Deleting a file removes its stored block objects and metadata, with
   recovery/cleanup handling for partial failures.
7. Acceptance Criteria
The project is considered functionally complete when:
- A small test file and a file larger than one block can be uploaded
  successfully.
- The backend creates multiple blocks for files larger than the
  configured block size.
- Objects in Supabase Storage contain encrypted data rather than the
  original plaintext file.
- The original file can be downloaded and reconstructed byte-for-byte.
- Tampered ciphertext fails authenticated decryption and is not
  returned as a valid file.
- Unauthorized users cannot list, download, or delete another user's
  files.
- The application handles empty files, unsupported types (if
  restrictions are configured), oversized files, missing blocks, and
  cloud/network errors safely.
- The frontend shows clear status and error messages.
- No service-role/secret key or encryption key is committed to Git or
  exposed to frontend code.
- Setup instructions and test results are documented.
- Instructor approval is obtained for the use of Supabase instead of
  the named providers and for omitting the CDN requirement.
8. Deliverables
- Frontend source code.
- Backend source code.
- Database schema and RLS policies/migration SQL.
- Supabase Storage bucket setup instructions.
- .env.example files without real secrets.
- README with setup, run, test, and cleanup instructions.
- Architecture and API documentation.
- Test cases and evidence of successful upload, encryption, download,
  reconstruction, and access control.
- Final report and demonstration screenshots/video, if required by the
  course.
9. Important Technical and Security Principles
- Encryption must occur before uploading the file data to Storage.
- AES-GCM nonce values must never be reused with the same encryption
  key.
- A server-side key stored beside ciphertext in the same database or
  bucket does not provide meaningful key separation.
- Do not place a Supabase service-role/secret key or encryption key in
  React environment variables prefixed with VITE_.
- Use least privilege, authenticated user ownership checks, input
  limits, and safe object paths.
- Do not mark a file ready until all blocks and metadata have been
  committed successfully.
- Design deletion and failed uploads to clean up partially uploaded
  objects.
- Do not log file contents, credentials, encryption keys, or sensitive
  signed URLs.
- Treat the initial 1 MiB chunk size as a configurable starting point,
  not a universal optimum; test with representative file sizes and
  adjust based on memory, latency, and request limits.