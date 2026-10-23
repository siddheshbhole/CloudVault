-- CloudVault - Database Schema
-- Execute this in your Supabase SQL Editor

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Files table
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

-- 3. File blocks table
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
