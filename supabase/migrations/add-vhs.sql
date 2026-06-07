-- VHS kasete: pokreni u Supabase Dashboard -> SQL Editor
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS is_vhs BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vhs_cassette_count INTEGER,
  ADD COLUMN IF NOT EXISTS vhs_cassette_condition TEXT,
  ADD COLUMN IF NOT EXISTS vhs_price_per_cassette NUMERIC(12, 2) DEFAULT 30;

CREATE INDEX IF NOT EXISTS idx_tickets_is_vhs ON public.tickets(is_vhs);
