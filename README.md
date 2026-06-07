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
```

Rezultat je u folderu `dist/` — to ide na Hostinger.

## Deploy

Vidi **[DEPLOY-HOSTINGER.md](./DEPLOY-HOSTINGER.md)** — GitHub + Hostinger korak po korak.

## Ostalo

- `SETUP-BAZA.md` — nova Supabase baza / migracija
- `npm run reset-password` — kreiranje admin naloga
- `npm run migrate-data` — migracija iz stare baze
