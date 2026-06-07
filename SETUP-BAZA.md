# Postavljanje sopstvene Supabase baze

Ovaj vodič ti omogućava da napraviš **novu bazu pod tvojim nalogom**, nezavisno od Hostinger Horizona.

## Korak 1 — Napravi Supabase nalog i projekat

1. Idi na [supabase.com](https://supabase.com) i registruj se (besplatno)
2. **New project**
3. Ime projekta: npr. `pc-servis-admin`
4. Postavi lozinku za bazu (sačuvaj je!)
5. Region: najbliži (npr. Frankfurt)
6. Sačekaj ~2 min da se projekat kreira

---

## Korak 2 — Pokreni SQL šemu

1. U Supabase panelu: **SQL Editor → New query**
2. Otvori fajl `supabase/schema.sql` iz ovog projekta
3. Kopiraj **cijeli sadržaj** i zalijepi u SQL Editor
4. Klikni **Run**

Ovo kreira tabele: `users`, `clients`, `tickets`, `parts`, `parts_categories`, `parts_sales`, `parts_sales_new`

---

## Korak 3 — Auth podešavanja

**Authentication → Providers → Email:**
- Uključi Email provider
- **Isključi** "Confirm email" (Auto Confirm) — da odmah možeš da se uloguješ

**Authentication → URL Configuration:**
- Site URL: `http://localhost:3001`
- Redirect URLs:
  - `http://localhost:3000/**`
  - `http://localhost:3001/**`
  - `https://www.computerdoctor.in/**`

---

## Korak 4 — Poveži aplikaciju

1. **Project Settings → API**
2. Kopiraj:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (tajni, ne dijeli!)

3. U `.env` fajlu zamijeni stare vrijednosti:

```env
VITE_SUPABASE_URL=https://NOVI-PROJEKAT.supabase.co
VITE_SUPABASE_ANON_KEY=novi-anon-key
SUPABASE_SERVICE_ROLE_KEY=novi-service-role-key
```

---

## Korak 5 — Napravi admin nalog

U terminalu (u folderu projekta):

```powershell
npm run reset-password -- tvoj@email.com TvojaLozinka123
```

Primjer:
```powershell
npm run reset-password -- prodaja@computer-doctor.me Servis2026!
```

---

## Korak 6 — Pokreni aplikaciju

```powershell
npm run dev
```

Otvori `http://localhost:3001` i uloguj se sa emailom i lozinkom iz koraka 5.

---

## Napomena o starim podacima

Nova baza je **prazna**. Stari tiketi i klijenti iz Horizon baze **neće se automatski prebaciti** jer nemaš pristup starom Supabase nalogu.

Ako kasnije dobiješ pristup staroj bazi, mogu pomoći sa export/import podataka.

---

## Deploy na www.computerdoctor.in

Kad sve radi lokalno:

1. `npm run build`
2. Upload `dist/` folder na Hostinger
3. U Supabase Auth URL Configuration dodaj `https://www.computerdoctor.in/**`

---

## Migracija tiketa iz stare Horizon baze

Ako imaš podatke na starom Supabase projektu (`wogcdrvkthkjaatwzknv`), možeš ih prebaciti u novu bazu.

### Priprema

1. Napravi **novu** Supabase bazu (koraci 1-4 iznad)
2. Pokreni `supabase/schema.sql` na **novoj** bazi
3. U `.env` dodaj credentials za **obje** baze:

```env
# Nova baza (glavna)
VITE_SUPABASE_URL=https://NOVA-BAZA.supabase.co
VITE_SUPABASE_ANON_KEY=novi-anon-key
SUPABASE_SERVICE_ROLE_KEY=novi-service-role-key

# Stara baza (Horizon)
OLD_SUPABASE_URL=https://wogcdrvkthkjaatwzknv.supabase.co
OLD_SUPABASE_SERVICE_ROLE_KEY=stari-service-role-key
```

### Pokreni migraciju

```powershell
npm run migrate-data
```

Skripta prebacuje:
- tikete (`tickets`)
- klijente (`clients`)
- dijelove (`parts`, `parts_categories`)
- prodaje (`parts_sales`, `parts_sales_new`)

Backup se čuva u `data/export-backup.json`.

### Ako nemaš stari service_role ključ

Probaj sa loginom sa live sajta u `.env`:

```env
OLD_EXPORT_EMAIL=prodaja@computer-doctor.me
OLD_EXPORT_PASSWORD=lozinka-sa-computerdoctor.in
```

### Gdje naći stari service_role ključ?

- Hostinger Horizon → projekat → Supabase / Database settings
- Ili kontaktiraj Hostinger podršku za pristup Supabase projektu `wogcdrvkthkjaatwzknv`
