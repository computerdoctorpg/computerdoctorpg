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

| Varijabla | Obavezno |
|-----------|----------|
| `VITE_SUPABASE_URL` | Da |
| `VITE_SUPABASE_ANON_KEY` | Da |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Za email |
| `SUPABASE_SERVICE_ROLE_KEY` | Za operatere |

Start mora biti **`npm start`** (Node server), ne samo statički `dist/`.

Nakon dodavanja klikni **Redeploy**.

## Deploy

Vidi **[DEPLOY-HOSTINGER.md](./DEPLOY-HOSTINGER.md)** — GitHub + Hostinger korak po korak.

## Ostalo

- `SETUP-BAZA.md` — nova Supabase baza / migracija
- `npm run reset-password` — kreiranje admin naloga
- `npm run migrate-data` — migracija iz stare baze
