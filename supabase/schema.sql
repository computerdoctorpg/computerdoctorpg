-- ============================================================
-- PC Servis Admin - Supabase schema
-- Pokreni u: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operater' CHECK (role IN ('admin', 'operater')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL UNIQUE,
  is_warranty_client BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  device_name TEXT NOT NULL,
  device_serial TEXT,
  charger_serial TEXT,
  battery_serial TEXT,
  issue_description TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  os_password TEXT,
  keep_data BOOLEAN NOT NULL DEFAULT FALSE,
  has_bag BOOLEAN NOT NULL DEFAULT FALSE,
  bag_description TEXT,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  repair_details TEXT DEFAULT '',
  parts_used TEXT DEFAULT '',
  parts_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  service_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  dispatch_note_number TEXT,
  is_warranty BOOLEAN NOT NULL DEFAULT FALSE,
  warranty_until DATE,
  warranty_invoice TEXT,
  is_vhs BOOLEAN NOT NULL DEFAULT FALSE,
  vhs_cassette_count INTEGER,
  vhs_cassette_condition TEXT,
  vhs_price_per_cassette NUMERIC(12, 2) DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.parts_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.parts_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  manufacturer TEXT,
  part_number TEXT,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parts_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  part_name TEXT,
  customer_name TEXT,
  sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sold_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parts_sales_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_surname TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON public.tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_is_warranty ON public.tickets(is_warranty);
CREATE INDEX IF NOT EXISTS idx_tickets_is_vhs ON public.tickets(is_vhs);
CREATE INDEX IF NOT EXISTS idx_tickets_deleted_at ON public.tickets(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_parts_category_id ON public.parts(category_id);
CREATE INDEX IF NOT EXISTS idx_parts_sales_new_sale_date ON public.parts_sales_new(sale_date DESC);

-- ============================================================
-- HELPERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND (u.role = 'admin' OR u.email = 'prodaja@computer-doctor.me')
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = 'prodaja@computer-doctor.me' THEN 'admin'
      ELSE 'operater'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_sales_new ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write app data
CREATE POLICY "auth_read_users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_own_user" ON public.users FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "auth_insert_users_admin" ON public.users FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "auth_all_clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_tickets" ON public.tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_parts_categories" ON public.parts_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_parts" ON public.parts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_parts_sales" ON public.parts_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_parts_sales_new" ON public.parts_sales_new FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Only admin can delete users from public.users table
CREATE POLICY "auth_delete_users_admin" ON public.users FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- SAMPLE DATA (optional - delete if not needed)
-- ============================================================

INSERT INTO public.parts_categories (name, description) VALUES
  ('RAM', 'Memorijski moduli'),
  ('SSD/HDD', 'Diskovi'),
  ('Ekrani', 'LCD paneli'),
  ('Baterije', 'Laptop baterije');
