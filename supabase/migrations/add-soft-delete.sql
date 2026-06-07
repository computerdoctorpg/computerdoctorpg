-- Soft delete (recycle bin) for tickets
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tickets_deleted_at ON public.tickets(deleted_at)
  WHERE deleted_at IS NOT NULL;
