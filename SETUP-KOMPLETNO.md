# Kompletan setup — Supabase + Hostinger

## Šta JA mogu zavraviti iz koda ✅

- [x] GitHub repo + deploy na Hostinger
- [x] `computerdoctor.in` — novi sajt
- [x] Runtime Supabase env fix (`server.mjs`)
- [x] Skripte: `export-data`, `import-data`, `reset-password`
- [x] SQL šema: `supabase/schema.sql`

## Šta TI moraš uraditi u panelu (5 min) 🔑

### Korak 1 — Novi Supabase (Hostinger wizard)

1. Hostinger → Node.js app → **Connect database** → **Supabase** → Continue
2. Kreiraj **novi** Supabase projekat (tvoj nalog)
3. Kopiraj **Project URL** i **anon key**

### Korak 2 — SQL šema

1. [supabase.com/dashboard](https://supabase.com/dashboard) → tvoj novi projekat
2. **SQL Editor** → zalijepi `supabase/schema.sql` → **Run**

### Korak 3 — Auth URLs

**Authentication → URL Configuration:**
- Site URL: `https://computerdoctor.in`
- Redirect URLs:
  - `https://computerdoctor.in/**`
  - `https://www.computerdoctor.in/**`

Isključi **Confirm email** (Auto Confirm).

### Korak 4 — `.env` lokalno

```env
# NOVA baza
VITE_SUPABASE_URL=https://NOVI-PROJEKAT.supabase.co
VITE_SUPABASE_ANON_KEY=novi-anon-key
SUPABASE_SERVICE_ROLE_KEY=novi-service-role-key

# STARA baza (export)
OLD_SUPABASE_URL=https://wogcdrvkthkjaatwzknv.supabase.co
OLD_EXPORT_EMAIL=prodaja@computer-doctor.me
OLD_EXPORT_PASSWORD=tvoja-lozinka
```

Service role: Supabase → Settings → API → **service_role** (secret).

### Korak 5 — Migracija podataka (terminal)

```powershell
cd "c:\Users\USER\Desktop\Projekti\Moj servis"
npm run export-data
npm run import-data
npm run reset-password -- prodaja@computer-doctor.me NovaLozinka123
```

### Korak 6 — Hostinger env + redeploy

U Node.js app → Environment variables:
- `VITE_SUPABASE_URL` = novi URL
- `VITE_SUPABASE_ANON_KEY` = novi anon key

**Redeploy**

### Korak 7 — www + Horizon

- Dodaj `www.computerdoctor.in` na isti Node.js deploy
- **Ugasi Horizon** projekat

---

## Brzi test

| Test | URL |
|------|-----|
| Login | https://computerdoctor.in |
| Tiketi | Nakon logina na dashboardu |
| www | https://www.computerdoctor.in (isti sajt) |

---

## Ako ostaneš na STAROJ Supabase bazi

Ne treba migracija — samo env na Hostingeru (već radi):

```
VITE_SUPABASE_URL=https://wogcdrvkthkjaatwzknv.supabase.co
VITE_SUPABASE_ANON_KEY=(iz .env)
```

Nova baza = **tvoja kontrola**, stara = **radi odmah**.
