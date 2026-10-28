-- CloudVault - Folders Migration
-- Execute this in your Supabase SQL Editor

-- 1. Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name TEXT NOT NULL DEFAULT 'New Folder',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Add folder_id column to files table (nullable, files without folder are "root" files)
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- 3. Enable RLS on folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for folders
CREATE POLICY "Users can select own folders"
    ON public.folders
    FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own folders"
    ON public.folders
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own folders"
    ON public.folders
    FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own folders"
    ON public.folders
    FOR DELETE
    USING (auth.uid() = owner_id);
