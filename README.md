# PC Servis Admin — Computer Doctor

Administrativni panel za PC servis (tiketi, dijelovi, finansije).

## Tech stack

- React 19 + Vite
- Tailwind CSS
- Supabase (auth + baza)

## Lokalni rad

```powershell
npm install
npm run dev
```

Aplikacija: `http://localhost:3000` (ili 3001 ako je 3000 zauzet)

Kopiraj `.env.example` u `.env` i popuni Supabase ključeve.

## Build

```powershell
npm run build
npm start
```

Rezultat je u folderu `dist/` — to ide na Hostinger.

### Hostinger Node.js Web App podešavanja

| Polje | Vrijednost |
|-------|------------|
| Framework | Vite |
| Build command | `npm run build` |
| Start command | `npm start` |
| Output directory | `dist` |
| Node.js | 20 ili 22 |

**Environment varijable (obavezno u Hostinger panelu):**
- `VITE_SUPABASE_URL` (ili `SUPABASE_URL`)
- `VITE_SUPABASE_ANON_KEY` (ili `SUPABASE_ANON_KEY`)

Nakon dodavanja klikni **Redeploy**.

## Deploy

Vidi **[DEPLOY-HOSTINGER.md](./DEPLOY-HOSTINGER.md)** — GitHub + Hostinger korak po korak.

## Ostalo

- `SETUP-BAZA.md` — nova Supabase baza / migracija
- `npm run reset-password` — kreiranje admin naloga
- `npm run migrate-data` — migracija iz stare baze
