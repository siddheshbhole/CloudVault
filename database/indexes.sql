-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_owner_id ON public.files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON public.files(status);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_blocks_file_id ON public.file_blocks(file_id);
CREATE INDEX IF NOT EXISTS idx_file_blocks_ordering ON public.file_blocks(file_id, block_index ASC);
