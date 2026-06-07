# Deploy na Hostinger preko GitHub-a

Domen: **www.computerdoctor.in**

---

## Korak 1 — GitHub nalog (jednom)

1. Idi na [github.com/signup](https://github.com/signup)
2. Registruj se (email, lozinka, username)
3. Potvrdi email

---

## Korak 2 — Novi repo na GitHubu

1. GitHub → **+** → **New repository**
2. Ime: npr. `pc-servis-admin`
3. **Private** (preporučeno — imaš poslovne podatke)
4. **Ne** štikliraj README / .gitignore (već postoje lokalno)
5. **Create repository**

---

## Korak 3 — Prvi push sa tvog računara

U terminalu (PowerShell), u folderu projekta:

```powershell
cd "c:\Users\USER\Desktop\Projekti\Moj servis"

git init
git add .
git commit -m "Initial commit - PC Servis Admin"
git branch -M main
git remote add origin https://github.com/TVOJ-USERNAME/pc-servis-admin.git
git push -u origin main
```

Zamijeni `TVOJ-USERNAME` i ime repoa stvarnim vrijednostima.

Pri prvom push-u GitHub traži login — koristi **Personal Access Token** umjesto lozinke:
- GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic)
- Scope: `repo`
- Kopiraj token i koristi ga kao lozinku pri `git push`

---

## Korak 4 — Hostinger Git Deployment

1. [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. **Websites** → izaberi **computerdoctor.in**
3. **Advanced** → **Git** (ili **Deployments** / **Git Version Control**)
4. **Create repository** / **Connect GitHub**
5. Autorizuj GitHub i izaberi repo `pc-servis-admin`
6. Branch: `main`

### Build podešavanja (Hostinger)

| Polje | Vrijednost |
|-------|------------|
| Framework | Vite / React (ili Custom) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20 ili 22 |

### Environment varijable (obavezno!)

`.env` **nije** u Git-u. U Hostinger deploy settings dodaj:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://....supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | tvoj anon key |

Bez ovoga build radi, ali login neće raditi na live sajtu.

---

## Korak 5 — Domen

Hostinger obično automatski servira iz `public_html`. Ako Git deploy ide u podfolder:

- Provjeri da **document root** pokazuje na folder gdje je `index.html` iz builda
- `.htaccess` iz `public/` se kopira u `dist/` pri buildu (SPA routing)

---

## Svaki sljedeći update

```powershell
git add .
git commit -m "Opis promjene"
git push
```

Hostinger automatski rebuilda i objavljuje (1–3 min).

---

## Supabase — URL za produkciju

U Supabase Dashboard → **Authentication → URL Configuration**:

- Site URL: `https://www.computerdoctor.in`
- Redirect URLs: `https://www.computerdoctor.in/**`

---

## Problemi?

| Problem | Rješenje |
|---------|----------|
| Bijela stranica | Provjeri env varijable na Hostingeru |
| 404 na refresh | `.htaccess` mora biti u root-u deploya |
| Login ne radi | Supabase URL Configuration + env ključevi |
| Build fail | `npm run build` lokalno prvo — popravi greške |
