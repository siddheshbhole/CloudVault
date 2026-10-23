-- =========================================================
-- CloudVault Complete Database Setup Script
-- Copy and run this once in your Supabase SQL Editor
-- =========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Files Table
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    original_name TEXT NOT NULL,
    content_type TEXT,
    original_size BIGINT NOT NULL,
    chunk_size INTEGER NOT NULL,
    block_count INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'ready', 'failed', 'deleting')),
    encryption_version TEXT NOT NULL DEFAULT 'AES-256-GCM-v1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create File Blocks Table
CREATE TABLE IF NOT EXISTS public.file_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    block_index INTEGER NOT NULL,
    object_path TEXT NOT NULL UNIQUE,
    plaintext_size INTEGER NOT NULL,
    ciphertext_size INTEGER NOT NULL,
    nonce TEXT NOT NULL,
    auth_tag TEXT,
    checksum TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_file_block_index UNIQUE (file_id, block_index)
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_files_owner_id ON public.files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON public.files(status);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_blocks_file_id ON public.file_blocks(file_id);
CREATE INDEX IF NOT EXISTS idx_file_blocks_ordering ON public.file_blocks(file_id, block_index ASC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_blocks ENABLE ROW LEVEL SECURITY;

-- 6. Setup Policies for Backend & Users
-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow all for service role on files" ON public.files;
DROP POLICY IF EXISTS "Allow all for service role on blocks" ON public.file_blocks;

-- Service role full access policy (for backend operations)
CREATE POLICY "Allow all for service role on files"
    ON public.files
    FOR ALL
    TO authenticated, service_role, anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for service role on blocks"
    ON public.file_blocks
    FOR ALL
    TO authenticated, service_role, anon
    USING (true)
    WITH CHECK (true);
