# Baza na Hostinger MySQL — plan migracije

## Da, možemo — ali ovo je veći posao

Trenutno:
```
React app  →  Supabase (cloud, tuđi nalog)
```

Cilj:
```
React app  →  Node API (server.mjs)  →  MySQL (Hostinger, tvoja baza)
```

**Sve na Hostingeru pod tvojom kontrolom.**

---

## Faza 1 — Kreiraj MySQL bazu (TI, u hPanelu)

1. hPanel → **Websites** → **Databases** → **MySQL Databases**
2. **Create database** — npr. `u123456789_pc_servis`
3. **Create user** + dodijeli bazu
4. Sačuvaj:
   - Host (npr. `srv123.hstgr.io`)
   - Database name
   - Username
   - Password

5. Otvori **phpMyAdmin** → izaberi bazu → **SQL** tab
6. Zalijepi cijeli `database/schema.mysql.sql` → **Go**

---

## Faza 2 — Backend API (JA u kodu)

Dodajemo u projekat:
- MySQL konekcija (`mysql2`)
- Login sa JWT (umjesto Supabase auth)
- API rute: `/api/tickets`, `/api/clients`, `/api/parts`...
- Zamjena `db.js` i `SupabaseAuthContext`

Procjena: **1–2 dana rada**.

---

## Faza 3 — Migracija podataka iz Supabase

Kad API radi, skripta:
1. Uloguje se na staru Supabase bazu (tvoj login koji radi)
2. Izvozi tikete, klijente, dijelove
3. Uvozi u Hostinger MySQL

---

## Faza 4 — Env varijable na Hostingeru

Zamijeni Supabase ključeve sa:

| Varijabla | Opis |
|-----------|------|
| `DB_HOST` | MySQL host iz hPanela |
| `DB_USER` | MySQL korisnik |
| `DB_PASSWORD` | MySQL lozinka |
| `DB_NAME` | Ime baze |
| `JWT_SECRET` | Nasumična dugačka lozinka |

---

## Supabase vs Hostinger MySQL

| | Supabase (sada) | Hostinger MySQL |
|--|-----------------|-----------------|
| Vlasništvo | Horizon / tuđi nalog | **100% tvoje** |
| Cijena | Besplatno (limit) | Uključeno u hosting |
| Posao | Već radi | Treba backend (~2 dana) |
| Backup | Supabase panel | hPanel backup |

---

## Preporuka

Pošto **deploy već radi** sa Supabase:

1. **Kratkoročno** — ostavi Supabase, poveži `computerdoctor.in` na novi deploy
2. **Srednjoročno** — napravimo MySQL + API (Faza 2–3)

Ili odmah krenemo na MySQL ako ti je prioritet **puna kontrola baze**.

---

## Sljedeći korak

Ako želiš da krenemo **sada**:

1. Napravi MySQL bazu u hPanelu (Faza 1)
2. Javi mi da si gotov (ne šalji lozinku ovdje)
3. Ja krenem sa backend API-jem u kodu

Reci: **"kreni na mysql"** kad baza bude kreirana u hPanelu.
