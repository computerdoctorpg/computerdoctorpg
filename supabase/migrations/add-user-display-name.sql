-- Dodaje ime operatera (prikaz umjesto internog emaila)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name TEXT;

COMMENT ON COLUMN public.users.display_name IS 'Ime operatera za prikaz i login (bez pravog emaila)';
