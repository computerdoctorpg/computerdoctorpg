# Lansiranje na Hostinger — operativno

Domen: **https://www.computerdoctor.in**  
Repo: **https://github.com/computerdoctorpg/computerdoctorpg**

> **Važno:** Ovo **nije** običan statički sajt (`dist` samo).  
> Potreban je **Node.js Web App** jer server radi email, korpu, operatere i backup (`server.mjs`).

---

## Pregled — šta ide gdje

| Komponenta | Gdje radi |
|------------|-----------|
| React aplikacija | Hostinger Node.js (`npm run build` → `dist/`) |
| API (email, korpa, backup) | `npm start` → `server.mjs` |
| Baza + login | Supabase (cloud) |
| SMTP email | Hostinger mail (`servis@computerdoctor.in`) |

---

## KORAK 1 — Push koda na GitHub

Na računaru, u folderu projekta:

```powershell
cd "c:\Users\USER\Desktop\Projekti\Moj servis"

git add .
git commit -m "Production ready: server API, korpa, operateri, backup, email"
git push origin main
```

Ako `git push` traži lozinku → koristi **GitHub Personal Access Token** (Settings → Developer settings → Tokens).

---

## KORAK 2 — Hostinger Node.js aplikacija

1. Otvori **[hpanel.hostinger.com](https://hpanel.hostinger.com)**
2. **Websites** → **computerdoctor.in**
3. Traži **Node.js Web Applications** (ili **Advanced → Node.js**)
4. **Create application** / **Import Git repository**
5. Poveži GitHub → repo **`computerdoctorpg/computerdoctorpg`**
6. Branch: **`main`**

### Build & start (obavezno tačno ovako)

| Polje | Vrijednost |
|-------|------------|
| Node.js verzija | **20** ili **22** |
| Root directory | `/` (root repoa) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| **Start command** | **`npm start`** |
| Entry file | `server.mjs` (ako pita) |

**NE** koristi samo „Static site“ / „Output: dist“ bez Node servera — email i korpa neće raditi.

---

## KORAK 3 — Environment varijable

U Hostinger Node.js app → **Environment variables** dodaj **sve**:

### Supabase (obavezno — nova baza)

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://jhspxxkershzrvjnbxnn.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(Supabase Dashboard → Settings → API → anon public)* |

Brzo kopiranje svih varijabli iz lokalnog `.env`:

```powershell
npm run hostinger-env
```

### SMTP — email prijemnice/otpremnice (obavezno)

| Key | Value |
|-----|-------|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `servis@computerdoctor.in` |
| `SMTP_PASS` | `"Servis1243#"` ← **navodnici zbog `#`** |
| `SMTP_FROM` | `servis@computerdoctor.in` |
| `SMTP_FROM_NAME` | `Computer Doctor` |

### Operateri + kompletan backup (preporučeno)

| Key | Value |
|-----|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | *(Supabase → Settings → API → service_role)* |

Bez service role: login i nalozi rade, ali **kreiranje operatera** iz Admin panela neće raditi.

### Automatski (Hostinger postavlja)

| Key | Napomena |
|-----|----------|
| `PORT` | Hostinger dodaje sam — **ne mijenjaj** |

---

## KORAK 4 — Domen

1. Node.js app poveži na **`computerdoctor.in`** i **`www.computerdoctor.in`**
2. SSL (HTTPS) — uključi / Auto SSL u Hostingeru
3. Ako postoji stari **Horizon / Static site** deploy za isti domen → **ugasi ga** (samo jedan aktivan)
4. **Provjera API-ja** (mora vratiti JSON, ne HTML):

```powershell
curl.exe -s -X POST https://www.computerdoctor.in/api/send-ticket-email -H "Content-Type: application/json" -d "{}"
```

- ✅ Ispravno: `{"error":"Morate biti ulogovani..."}` (401)
- ❌ Pogrešno: `<!doctype html>` → još uvijek statički hosting, nije Node.js app

---

## KORAK 5 — Supabase Auth URLs

*(Treba pristup Supabase Dashboardu — vlasnik projekta)*

**Authentication → URL Configuration:**

- Site URL: `https://www.computerdoctor.in`
- Redirect URLs:
  - `https://www.computerdoctor.in/**`
  - `https://computerdoctor.in/**`

**Authentication → Providers → Email:** isključi „Confirm email“ (Auto Confirm).

> Ako nemaš Supabase pristup, login može raditi i bez ovoga ako je već podešeno na staroj bazi.

---

## KORAK 6 — Deploy / Redeploy

1. Klikni **Deploy** ili **Redeploy**
2. Sačekaj 2–5 min (build + start)
3. Otvori **https://www.computerdoctor.in**

---

## KORAK 7 — Test checklist

| Test | Očekivano |
|------|-----------|
| Login admin | `prodaja@computer-doctor.me` + lozinka |
| Nalozi se učitavaju | Lista tiketa vidljiva |
| Novi nalog | Kreiranje + prijemnica |
| Otpremnica | Na završenom nalogu |
| Email klijentu | Pošalji prijemnici na email |
| Korpa | Obriši nalog → tab Korpa → vidljivo na drugom uređaju |
| Admin → Operateri | Kreiraj operatera (treba service role) |
| Admin → Backup | Preuzmi JSON backup |

---

## Svaki sljedeći update

```powershell
git add .
git commit -m "Opis promjene"
git push
```

Zatim u Hostingeru **Redeploy** (ili auto-deploy ako je uključen).

---

## Problemi

| Problem | Rješenje |
|---------|----------|
| Bijela stranica | Provjeri env: `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` |
| Login ne radi | Supabase URL Configuration + tačni ključevi |
| Email ne radi | SMTP env vars, lozinka u navodnicima, redeploy; provjeri curl gore |
| Korpa samo lokalno | Mora `npm start` (Node app), ne statički hosting |
| API vraća HTML | Ugasi Horizon/static deploy; uključi Node.js Web App sa `npm start` |
| Build fail | Lokalno: `npm run build` — popravi greške pa push |
| 502 / app ne starta | Start command mora biti `npm start`, Node 20+ |

---

## Nova Supabase baza (opciono — puna kontrola)

Ako želiš **svoj** Supabase umjesto starog projekta:

1. Vidi **SETUP-KOMPLETNO.md** i **SETUP-BAZA.md**
2. Pokreni `supabase/schema.sql` u SQL Editoru
3. `npm run export-data` → `npm run import-data`
4. Zamijeni env varijable na Hostingeru novim ključevima
5. Redeploy

---

## Brza provjera lokalno prije push-a

```powershell
npm run build
npm start
```

Otvori `http://localhost:3000` — ako radi, spremno je za Hostinger.
