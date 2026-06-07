-- Garantni rok: pokreni u Supabase Dashboard -> SQL Editor
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS is_warranty_client BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS is_warranty BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS warranty_until DATE,
  ADD COLUMN IF NOT EXISTS warranty_invoice TEXT;

CREATE INDEX IF NOT EXISTS idx_tickets_is_warranty ON public.tickets(is_warranty);
