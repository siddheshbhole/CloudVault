-- Row Level Security (RLS) Policies
-- Enable RLS on both tables
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_blocks ENABLE ROW LEVEL SECURITY;

-- Policy for files: Users can view their own files
CREATE POLICY "Users can select own files"
    ON public.files
    FOR SELECT
    USING (auth.uid() = owner_id);

-- Policy for files: Users can insert their own files
CREATE POLICY "Users can insert own files"
    ON public.files
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Policy for files: Users can update own files
CREATE POLICY "Users can update own files"
    ON public.files
    FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Policy for files: Users can delete own files
CREATE POLICY "Users can delete own files"
    ON public.files
    FOR DELETE
    USING (auth.uid() = owner_id);

-- Policy for file_blocks: Users can view blocks of files they own
CREATE POLICY "Users can select own file blocks"
    ON public.file_blocks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.files
            WHERE public.files.id = public.file_blocks.file_id
            AND public.files.owner_id = auth.uid()
        )
    );

-- Policy for file_blocks: Users can insert blocks for files they own
CREATE POLICY "Users can insert own file blocks"
    ON public.file_blocks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.files
            WHERE public.files.id = public.file_blocks.file_id
            AND public.files.owner_id = auth.uid()
        )
    );

-- Policy for file_blocks: Users can delete blocks of files they own
CREATE POLICY "Users can delete own file blocks"
    ON public.file_blocks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.files
            WHERE public.files.id = public.file_blocks.file_id
            AND public.files.owner_id = auth.uid()
        )
    );
