# Prompturi pentru generarea diagramelor de licență — FARO

> Fiecare prompt de mai jos îl **copiezi întreg și îl dai lui Claude Code** într-o sesiune nouă. Claude va genera diagrama în formatul cerut (Mermaid / draw.io XML / SVG / PNG după caz). Le-am scris **self-contained** — fiecare prompt conține tot contextul de care Claude are nevoie, deci nu trebuie să fie deja familiarizat cu proiectul.
>
> **Cum se folosesc:**
> 1. Deschide Claude Code într-un terminal nou (`claude`).
> 2. Copiază prompt-ul integral și apasă Enter.
> 3. Claude îți răspunde cu codul diagramei + (la unele) și fișierul salvat.
> 4. Mermaid se randează automat în GitHub/VSCode/Obsidian. Pentru PNG/SVG folosește **[mermaid.live](https://mermaid.live)** (paste + Export).
> 5. Draw.io XML → deschide la **[app.diagrams.net](https://app.diagrams.net)** → File → Import.

---

## 🎯 Înainte să începi — instalează un randator local (opțional)

Dacă vrei să generezi PNG-urile direct fără să accesezi mermaid.live:
```bash
npm install -g @mermaid-js/mermaid-cli
# Apoi din directorul cu fișierul .mmd:
mmdc -i diagram.mmd -o diagram.png -w 1600 -H 1200
```

---

## 📋 LISTA DIAGRAMELOR (10)

| # | Diagrama | Formatul ieșirii | Echivalent în lucrarea Giuliei |
|---|---|---|---|
| 1 | Schema bloc generală | Mermaid flowchart | Fig 2.5 |
| 2 | Modelul V | Mermaid graph | Fig 3.1 |
| 3 | Diagrama Gantt | Mermaid gantt | Fig 3.2 |
| 4 | Schema tehnologii utilizate | Mermaid flowchart | Fig 4.1 |
| 5 | Arhitectura per modul × 6 | Mermaid flowchart | Fig 4.2-4.4 |
| 6 | Structura fișierelor | Tree ASCII / Mermaid | Fig 4.5 |
| 7 | Schema bazei de date (ER) | Mermaid erDiagram | Fig 4.8 |
| 8 | Structuri de tabele (6) | Mermaid classDiagram | Fig 4.10-4.21 |
| 9 | Flow OCR bonuri (nou) | Mermaid sequenceDiagram | — |
| 10 | Flow autentificare JWT (nou) | Mermaid sequenceDiagram | — |

---

# 1️⃣ Schema bloc generală a aplicației

**Folosește pentru:** Capitolul 3 — "Schema bloc". Echivalent Fig 2.5 din lucrarea Giuliei.

### Prompt pentru Claude Code:
```
Generează o diagramă Mermaid (flowchart TB) care reprezintă schema bloc a 
aplicației FARO (platformă web de finanțe personale). Componentele:

- USER: utilizator pe Browser (Chrome/Safari/mobil)
- FRONTEND: React 18 SPA + Vite (servită din Railway, port 3000)
- BACKEND: Express + Prisma API REST (Node.js, port 4000, Railway)
- BD: PostgreSQL 18 (Railway plugin)
- AI: Google Gemini 2.5 Flash Lite (apelat doar de backend pentru OCR + insights)
- EMAIL: Resend API (apelat de backend pentru reset parolă)

Relațiile:
- USER trimite HTTPS la FRONTEND
- FRONTEND trimite HTTPS REST la BACKEND (cu JWT Bearer + cookie refresh)
- BACKEND citește/scrie din BD prin Prisma ORM (SQL parametrizat)
- BACKEND apelează Gemini API pentru: OCR bon, sugestii categorie, insights AI
- BACKEND apelează Resend pentru: email reset parolă

Folosește subgraph-uri pentru a grupa vizual:
- "Client" (USER + FRONTEND)
- "Server (Railway)" (BACKEND + BD)
- "Servicii externe" (AI + EMAIL)

Stilul: culori subtile, săgeți cu etichete. La final, salvează fișierul ca 
"docs/diagrams/01_schema_bloc.mmd" și generează și o versiune renderă PNG 
folosind mmdc dacă e instalat.
```

---

# 2️⃣ Modelul V — ciclul de viață al dezvoltării

**Folosește pentru:** Capitolul 3 — "Planificarea lucrărilor". Echivalent Fig 3.1.

### Prompt pentru Claude Code:
```
Generează o diagramă Mermaid (graph TD) care reprezintă ciclul de viață în V 
pentru un proiect software de licență. Trebuie să fie o formă în V cu două 
ramuri verticale unite prin linia orizontală a etapei de implementare:

Ramura stângă (de sus în jos — specificare):
1. Analiza cerințelor
2. Specificații funcționale
3. Proiectare arhitecturală
4. Proiectare detaliată

Centrul (jos):
5. Implementare / Codare

Ramura dreaptă (de jos în sus — verificare/testare):
6. Teste unitare      → verifică etapa 4
7. Teste de integrare → verifică etapa 3
8. Teste sistem       → verifică etapa 2
9. Teste de acceptare → verifică etapa 1

Conectează cu săgeți punctate orizontale între perechi (4↔6, 3↔7, 2↔8, 1↔9) 
pentru a indica relația specificare ↔ testare. Etapele verticale sunt 
conectate cu săgeți pline. Folosește subgraph-uri "Specificare", 
"Implementare", "Validare". Culori: albastru pentru stânga, verde pentru 
dreapta. Salvează la "docs/diagrams/02_model_v.mmd".
```

---

# 3️⃣ Diagrama Gantt — planificarea proiectului

**Folosește pentru:** Capitolul 3 — "Planificarea lucrărilor". Echivalent Fig 3.2.

### Prompt pentru Claude Code (TU UMPLI DATELE):
```
Generează un fișier Mermaid gantt cu planificarea proiectului FARO (aplicație
web de finanțe personale, licență 2026). Activitățile și duratele:

- Documentare și research            : 2025-12-01, 14d
- Specificații funcționale           : 2025-12-15, 10d
- Setup mediu dev (React + Express)  : 2025-12-25, 5d
- Proiectare BD (Prisma schema)      : 2026-01-01, 7d
- Autentificare (JWT + OAuth)        : 2026-01-08, 10d
- CRUD Tranzacții                    : 2026-01-18, 14d
- Module Bugete + Categorii          : 2026-02-01, 14d
- Statistici + Rapoarte              : 2026-02-15, 14d
- Integrare AI (Gemini OCR+insights) : 2026-03-01, 21d
- Notificări + email reset parolă    : 2026-03-22, 7d
- UI redesign + mod întunecat        : 2026-03-29, 14d
- Responsive mobile                  : 2026-04-12, 7d
- Testare + bug fixing               : 2026-04-19, 14d
- Deploy Railway                     : 2026-05-03, 5d
- Redactare documentație             : 2026-05-08, 21d
- Pregătire susținere                : 2026-05-29, 10d

(Ajustează datele dacă proiectul tău a avut alt timeline.)

Folosește syntaxa Mermaid gantt cu:
- dateFormat YYYY-MM-DD
- title "Planificarea proiectului FARO"
- secțiuni: "Planificare", "Implementare", "Polish & Deploy", "Documentare"

Salvează la "docs/diagrams/03_gantt.mmd". După aceea generează și o versiune
tabel Markdown cu coloanele: Activitate | Start | Durata | Final.
```

---

# 4️⃣ Schema tehnologii utilizate

**Folosește pentru:** Capitolul 4 — "Considerații privind implementarea". Echivalent Fig 4.1.

### Prompt pentru Claude Code:
```
Generează o diagramă Mermaid (flowchart LR) care arată toate tehnologiile
folosite în FARO și relațiile între ele. Categorii și componente:

FRONTEND (React side):
- React 18.3
- TypeScript 5.5
- Vite 5.3 (bundler)
- TanStack Query 5.51 (cache server state)
- Zustand 4.5 (client state)
- React Router 6.24
- Axios 1.7 (HTTP client)
- Lucide React (iconuri)
- CSS pur cu custom properties

BACKEND (Node side):
- Node.js 24
- Express (framework HTTP)
- Prisma 6.4 (ORM)
- Zod (validare schema)
- bcryptjs (hash parole, cost 10)
- jsonwebtoken (JWT HS256)
- Passport.js (OAuth Google + Facebook)
- helmet (security headers)
- Resend SDK (email)

EXTERNAL:
- PostgreSQL 18 (DB relațională)
- Google Gemini 2.5 Flash Lite (AI multimodal)
- Resend (email transactional)
- Railway (PaaS hosting + Postgres plugin)

PROTOCOL:
- HTTPS (TLS 1.3)
- WebSocket: NU folosim (REST only)

Arată cum se conectează:
- Frontend ←→ Backend via HTTPS REST
- Backend ←→ PostgreSQL via Prisma (parametrized SQL)
- Backend → Gemini via HTTPS POST (multimodal: text + image base64)
- Backend → Resend via HTTPS POST

Folosește subgraph-uri pentru "Client (Browser)", "Server (Railway)" și 
"Servicii AI/Email". Culori: violet pentru frontend, verde pentru backend,
portocaliu pentru external. Salvează la "docs/diagrams/04_tehnologii.mmd".
```

---

# 5️⃣ Arhitectura per modul (6 module)

**Folosește pentru:** Capitolul 4 — "Arhitectura programului". Echivalent Fig 4.2-4.4 (Giulia avea 3 module: părinte/coordonator/admin).

### Prompt pentru Claude Code:
```
Generează 6 diagrame Mermaid (flowchart TD), câte una per modul al aplicației
FARO. Fiecare modul reprezintă o pagină principală cu sub-funcționalitățile ei.

Modulele și funcționalitățile:

1. DASHBOARD (pagina principală):
   - Salutul personalizat (în funcție de ora zilei)
   - 3 carduri KPI: Sold curent, Venituri lună, Cheltuieli lună
   - Alertă tranzacții anormale (Z-score ≥ 2)
   - Grafic evoluție venituri+cheltuieli (12 luni)
   - Donut distribuție pe categorii (luna curentă)
   - Listă 5 tranzacții recente
   - Mini-progres pe bugete
   - Buton "+ Tranzacție" → navighează la /transactions?add=true

2. TRANZACȚII:
   - Listă paginată (10 per pagină) cu filtre (segment, perioadă, categorii, sumă)
   - Căutare după descriere/sumă
   - Adăugare tranzacție (formular complet)
   - Scanare bon fiscal (OCR Gemini) → preview bon digital → save
   - Editare/Ștergere
   - Suport tranzacții recurente (daily/weekly/monthly/yearly)
   - Export PDF/Excel
   - Drill-down din bugete (?category=...&from=...&to=...)

3. BUGETE:
   - Hero card cu buget total lunar
   - Listă carduri buget (per categorie sau total)
   - Creează/Editează buget
   - Selector lună (3 luni vizibile)
   - Click pe buget → navighează la tranzacțiile categoriei
   - Alerte la depășire

4. CATEGORII:
   - Listă categorii (default + custom user)
   - Adăugare categorie cu icoană + culoare
   - Editare doar pe cele user (cele default sunt locked)
   - Ștergere

5. RAPOARTE:
   - Generator 3-pași (Tip → Perioadă → Categorii)
   - Preview live (KPI + tabel + donut)
   - Export PDF cu PDFKit
   - Export Excel cu ExcelJS

6. SETĂRI:
   - Profil (nume, prenume, monedă, avatar)
   - Securitate (schimbă parolă, șterge cont)
   - Preferințe (dark mode, sound, format dată)
   - Notificări (toggle alerte buget)

Pentru fiecare modul folosește un nod central cu numele paginii, conectat la
sub-funcționalități prin săgeți. Subgraph "API endpoint" la fiecare pentru a 
arăta endpoint-urile backend folosite (ex: GET /transactions, POST /scan-receipt).

Salvează 6 fișiere separate: docs/diagrams/05_modul_dashboard.mmd,
05_modul_transactions.mmd, ..., 05_modul_settings.mmd.
```

---

# 6️⃣ Structura fișierelor proiectului

**Folosește pentru:** Capitolul 4 — "Structura fișierelor". Echivalent Fig 4.5.

### Prompt pentru Claude Code:
```
Generează un fișier text cu structura completă a proiectului FARO sub formă
de tree ASCII (output `tree` style cu ├── și └──). Proiectul e un monorepo
cu backend + frontend, deploy pe Railway.

Structura:

faro/  (root)
├── backend/
│   ├── prisma/
│   │   └── schema.prisma  (6 modele: User, Category, Transaction, Budget, 
│   │                        BudgetCategory, Notification)
│   ├── src/
│   │   ├── app.ts  (Express app: middleware, CORS, routes)
│   │   ├── server.ts  (bootstrap + listen)
│   │   ├── config/
│   │   │   └── env.ts  (Zod-validated environment)
│   │   ├── middleware/
│   │   │   ├── requireAuth.ts
│   │   │   └── errorHandler.ts
│   │   ├── shared/
│   │   │   ├── prisma.ts  (Prisma client singleton)
│   │   │   ├── cookies.ts  (refresh cookie helper)
│   │   │   ├── email.ts  (Resend wrapper)
│   │   │   ├── errors.ts  (AppError, NotFoundError)
│   │   │   └── default-categories.ts
│   │   └── modules/
│   │       ├── auth/  (auth.controller.ts, auth.service.ts, 
│   │       │          oauth.controller.ts, oauth.service.ts,
│   │       │          password-reset.service.ts, auth.routes.ts)
│   │       ├── user/  (user.controller.ts, user.service.ts, user.routes.ts)
│   │       ├── category/
│   │       ├── transaction/  (+ receipt-scanner.service.ts, 
│   │       │                   recurring-transaction-engine.ts)
│   │       ├── budget/  (+ budget-validator.ts)
│   │       ├── statistics/
│   │       ├── notification/
│   │       ├── report/  (export PDF + Excel)
│   │       └── insights/  (Gemini AI)
│   ├── package.json
│   ├── tsconfig.json
│   ├── railway.json
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx  (entry point)
│   │   ├── App.tsx  (routes)
│   │   ├── index.css  (1700+ linii: design tokens + responsive)
│   │   ├── components/
│   │   │   ├── BudgetWarningDialog.tsx
│   │   │   ├── CategoryIcon.tsx
│   │   │   ├── layout/  (MainLayout, Sidebar, Header, AiAssistantDrawer,
│   │   │   │            SearchPalette, NotificationDropdown)
│   │   │   └── ui/  (Modal, Button, Input, Select, EmptyState)
│   │   ├── features/  (per page)
│   │   │   ├── auth/  (Login, Register, ForgotPassword, ResetPassword)
│   │   │   ├── dashboard/Dashboard.tsx
│   │   │   ├── transactions/Transactions.tsx
│   │   │   ├── budgets/Budgets.tsx
│   │   │   ├── categories/Categories.tsx
│   │   │   ├── reports/Reports.tsx
│   │   │   └── settings/Settings.tsx
│   │   ├── hooks/  (useCategorySuggestion)
│   │   ├── services/  (api.ts axios + interceptori, 
│   │   │              transactions.service.ts, budgets.service.ts, etc.)
│   │   ├── store/useAuthStore.ts  (Zustand)
│   │   ├── styles/colors.ts
│   │   ├── types/shared.ts  (tipuri DB inlined)
│   │   └── utils/receiptOcr.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── railway.json
│   └── .env.example
├── README_DEPLOY.md
├── TECH_STACK.md
├── PREGATIRE_LICENTA.md
├── SPECIFICATII_TEHNICE.md
└── .gitignore

Salvează la "docs/diagrams/06_structura_fisiere.txt" cu encoding UTF-8.
Adaugă comentarii scurte (în paranteze, italice) pentru fișierele cheie.
```

---

# 7️⃣ Schema bazei de date (Entity-Relationship)

**Folosește pentru:** Capitolul 4 — "Structura bazei de date". Echivalent Fig 4.8.

### Prompt pentru Claude Code:
```
Generează o diagramă Mermaid erDiagram pentru baza de date FARO (PostgreSQL
relațională, schema gestionată cu Prisma ORM). 6 entități:

1. User
   - id (string, UUID, PK)
   - email (string, unique)
   - password (string, bcrypt hash)
   - firstName (string)
   - lastName (string)
   - currency (string, default "RON")
   - avatarUrl (string, opțional, base64 data URL)
   - budgetNotifications (boolean, default true) — toggle din Setări
   - createdAt, updatedAt

2. Category
   - id (string, UUID, PK)
   - name (string)
   - icon (string, opțional, emoji sau nume Lucide)
   - color (string, opțional, hex)
   - type ("income" | "expense")
   - userId (string, FK → User.id, NULL pentru categorii default globale)
   - isDefault (boolean) — true pentru cele predefinite
   - createdAt

3. Transaction
   - id (string, UUID, PK)
   - amount (Float, RON)
   - type ("income" | "expense")
   - description (string, opțional)
   - date (DateTime)
   - categoryId (string, FK → Category.id, ON DELETE RESTRICT)
   - userId (string, FK → User.id, ON DELETE CASCADE)
   - receiptUrl (string, opțional)
   - receiptData (Json, opțional) — bon digital structurat extras de Gemini
   - isRecurring (boolean)
   - recurringGroupId (string, opțional, UUID)
   - frequency (string, opțional) — "daily"|"weekly"|"monthly"|"yearly"
   - originalStartDate (DateTime, opțional)
   - sequenceNumber (Int, opțional)
   - createdAt
   - Index: (userId, date), (userId, recurringGroupId)

4. Budget
   - id (string, UUID, PK)
   - month (Int, 1-12)
   - year (Int)
   - totalLimit (Float, RON)
   - isTotal (boolean) — true = buget total lunar, false = per categorii
   - userId (string, FK → User.id)
   - createdAt
   - Unique: (userId, month, year, isTotal)

5. BudgetCategory  (tabelă de legătură M:N între Budget și Category)
   - id (string, UUID, PK)
   - budgetId (string, FK → Budget.id, ON DELETE CASCADE)
   - categoryId (string, FK → Category.id)
   - limitAmount (Float, RON)
   - createdAt
   - Unique: (budgetId, categoryId)

6. Notification
   - id (string, UUID, PK)
   - userId (string, FK → User.id, ON DELETE CASCADE)
   - type ("budget_exceeded" | "budget_near_limit" | "bill_reminder")
   - title (string)
   - message (string)
   - isRead (boolean, default false)
   - relatedEntityId (string, opțional)
   - createdAt

Relațiile:
- User 1—N Category (user.id ← category.userId)
- User 1—N Transaction (user.id ← transaction.userId)
- User 1—N Budget (user.id ← budget.userId)
- User 1—N Notification (user.id ← notification.userId)
- Category 1—N Transaction (category.id ← transaction.categoryId)
- Budget 1—N BudgetCategory (budget.id ← budgetCategory.budgetId)
- Category 1—N BudgetCategory (category.id ← budgetCategory.categoryId)

Folosește sintaxa Mermaid erDiagram standard cu PK, FK, UK ca atribute speciale.
Salvează la "docs/diagrams/07_schema_bd.mmd".
```

---

# 8️⃣ Structuri detaliate pe tabele (6 diagrame)

**Folosește pentru:** Capitolul 4 — câte un sub-capitol pentru fiecare tabelă. Echivalent Fig 4.10-4.21 (Giulia avea 12).

### Prompt pentru Claude Code:
```
Pentru fiecare din cele 6 tabele ale BD FARO (User, Category, Transaction,
Budget, BudgetCategory, Notification), generează câte o diagramă Mermaid
classDiagram (mai bună decât erDiagram pentru atribute detaliate cu tipuri și
constrângeri).

Pentru fiecare tabelă:
- Numele tabelei ca titlu de clasă
- Lista atributelor cu format: [PK/FK/UK] tip nume — descriere
- Lista constrângerilor (UNIQUE, INDEX) ca metode (cu prefix +)

Folosește schema din Capitolul 7 anterior pentru detalii.

Pentru Transaction adaugă explicit nota: "JSONB receiptData stochează bonul
digital ca: {merchant, address, date, time, items[], subtotal, vat, total,
paymentMethod, currency}".

Pentru Budget adaugă nota: "isTotal=true → buget global lunar (totalLimit
unic); isTotal=false → buget pe categorii (limita totală + BudgetCategory[])".

Salvează 6 fișiere: docs/diagrams/08a_table_user.mmd, 08b_table_category.mmd,
08c_table_transaction.mmd, 08d_table_budget.mmd, 08e_table_budgetcategory.mmd,
08f_table_notification.mmd.

La final, generează un singur fișier consolidat docs/diagrams/08_toate_tabelele.mmd
care le conține pe toate într-o singură imagine.
```

---

# 9️⃣ Flow OCR bonuri fiscale (sequence diagram)

**Folosește pentru:** Capitolul 4 — sub-capitol despre OCR. Nu există echivalent la Giulia (proiect nou).

### Prompt pentru Claude Code:
```
Generează o diagramă Mermaid sequenceDiagram care arată fluxul complet al
scanării unui bon fiscal în FARO. Actori:

- User (utilizator pe browser)
- Frontend (React SPA)
- Backend (Express API)
- Gemini API (Google Vision multimodal)
- Postgres (BD)

Pasii:
1. User apasă "Scanează bon" în modalul Adaugă Tranzacție
2. User selectează imagine (cameră sau galerie)
3. Frontend citește fișierul cu FileReader → base64
4. Frontend trimite POST /api/transactions/scan-receipt 
   {image: base64, mimeType: "image/jpeg"}
5. Backend validează auth (JWT Bearer)
6. Backend construiește prompt structurat pentru Gemini (JSON output forțat)
7. Backend trimite imaginea + prompt la Gemini API (model gemini-2.5-flash-lite)
8. Gemini procesează imaginea cu OCR multimodal + structurare
9. Gemini returnează JSON cu {merchant, items[], total, ...}
10. Backend validează JSON cu normalizeReceiptData() (filtrare câmpuri 
    invalide, coerce tipuri, default-uri)
11. Backend returnează 200 cu ScannedReceipt
12. Frontend pre-completează formularul cu datele extrase
13. Frontend cere sugestie categorie: GET /api/categories/suggest 
    cu descrierea = merchant
14. Backend → Gemini pentru clasificare → returnează categoryId
15. Frontend afișează ReceiptPreviewCard în modal (listă produse, total)
16. User verifică, eventual editează manual câmpurile
17. User apasă "Salvează"
18. Frontend trimite POST /api/transactions cu receiptData inclus
19. Backend salvează în Postgres (INSERT INTO Transaction cu receiptData JSONB)
20. Backend verifică buget (BudgetValidator.checkBudget)
21. Dacă peste buget → backend returnează 409 cu warning, NU salvează
22. Dacă OK → returnează 201 cu tranzacția creată
23. Frontend afișează toast succes + invalidează cache React Query
    (['transactions'], ['statistics'], ['notifications'])

Folosește note (autonumber on) pentru a numerota pașii. Adaugă note explicative 
pentru momentele cheie (ex: "Gemini are responseMimeType: application/json → 
output JSON valid garantat"). Salvează la "docs/diagrams/09_flow_ocr.mmd".
```

---

# 🔟 Flow autentificare JWT cu refresh rotation

**Folosește pentru:** Capitolul 4 — sub-capitol despre autentificare. Nou.

### Prompt pentru Claude Code:
```
Generează o diagramă Mermaid sequenceDiagram pentru fluxul complet de
autentificare în FARO cu JWT dual-token. Actori:

- User
- Frontend (Axios interceptors + Zustand store)
- Backend (Express)
- Postgres

Trei scenarii incluse:

SCENARIUL A — Login inițial:
1. User completează email + parolă, apasă Login
2. Frontend → POST /api/auth/login {email, password}
3. Backend validează cu Zod
4. Backend SELECT * FROM User WHERE email=$1
5. Backend bcrypt.compare(password, user.password)
6. Backend generează:
   - accessToken = jwt.sign({userId}, JWT_SECRET, {expiresIn: '15m'})
   - refreshToken = jwt.sign({userId}, JWT_REFRESH_SECRET, {expiresIn: '7d'})
7. Backend setează cookie httpOnly Secure SameSite=None cu refreshToken
8. Backend returnează {user, accessToken}
9. Frontend salvează accessToken în Zustand (memorie, NU localStorage)
10. Frontend navighează la /dashboard

SCENARIUL B — Request normal cu token valid:
11. Frontend → GET /api/transactions cu header Authorization: Bearer <accessToken>
12. Backend middleware requireAuth verifică jwt.verify(token, JWT_SECRET)
13. Token valid → req.user = {userId}
14. Backend returnează 200 cu datele

SCENARIUL C — Access token expirat (după 15 min):
15. Frontend → GET /api/budgets cu Bearer <accessToken expirat>
16. Backend middleware throw 401
17. Axios response interceptor prinde 401
18. Interceptor verifică: nu e endpoint auth (login/register), nu e deja retry
19. Interceptor → POST /api/auth/refresh (cu cookie httpOnly automat)
20. Backend citește refreshToken din cookie
21. Backend jwt.verify(refreshToken, JWT_REFRESH_SECRET) → userId
22. Backend emite nou accessToken + nou refreshToken (rotation)
23. Backend setează cookie nou + returnează nou accessToken
24. Interceptor primește nou accessToken → updatează Zustand store
25. Interceptor retry-ește request-ul original cu nou Bearer
26. Backend returnează 200

SCENARIUL D — Refresh eșuează (cookie expirat după 7 zile):
27. Interceptor → POST /api/auth/refresh
28. Backend → 401 Refresh token invalid
29. Interceptor capturează → Zustand.logout()
30. Frontend redirect la /login

Adaugă note pentru:
- "Refresh token în cookie httpOnly = inaccesibil XSS"
- "Access token în memorie Zustand = nu supraviețuiește refresh-ului paginii
  (se regenerează prin refresh la 401)"
- "SameSite=None Secure în producție (frontend + backend pe subdomenii diferite)"

Salvează la "docs/diagrams/10_flow_jwt.mmd".
```

---

# 🎁 BONUS — Prompt mare care le generează pe toate odată

Dacă vrei să rulezi totul într-un singur shot:

```
Citește mai întâi următoarele fișiere din proiect pentru context complet:
- TECH_STACK.md
- SPECIFICATII_TEHNICE.md  
- backend/prisma/schema.prisma

Apoi generează TOATE cele 10 diagrame de mai jos pentru lucrarea mea de
licență FARO (platformă web de finanțe personale). Fiecare diagramă trebuie
salvată ca fișier .mmd separat în docs/diagrams/ cu numerotare:

1. docs/diagrams/01_schema_bloc.mmd — schema bloc generală (flowchart)
2. docs/diagrams/02_model_v.mmd — modelul V de dezvoltare (graph)
3. docs/diagrams/03_gantt.mmd — diagrama Gantt cu activitățile proiectului
4. docs/diagrams/04_tehnologii.mmd — schema tehnologiilor utilizate
5. docs/diagrams/05_modul_*.mmd — câte o diagramă per pagină 
   (dashboard, transactions, budgets, categories, reports, settings)
6. docs/diagrams/06_structura_fisiere.txt — tree ASCII
7. docs/diagrams/07_schema_bd.mmd — ER diagram cu 6 entități
8. docs/diagrams/08_toate_tabelele.mmd — classDiagram cu 6 tabele
9. docs/diagrams/09_flow_ocr.mmd — sequenceDiagram OCR Gemini
10. docs/diagrams/10_flow_jwt.mmd — sequenceDiagram autentificare JWT

După generare:
- Verifică sintaxa Mermaid a fiecărui fișier (nu trebuie erori)
- Creează un fișier docs/diagrams/README.md cu listă + descriere scurtă
  pentru fiecare diagramă și instrucțiuni cum să le converteasc PNG
- Pe cele 4 mai complexe (1, 4, 7, 8) generează și PNG-uri folosind 
  npx @mermaid-js/mermaid-cli (mmdc -i X.mmd -o X.png -w 1600 -H 1200)

La final, dă-mi un sumar cu fișierele create și cum să le inserez în Word.
```

---

# 📌 Sfaturi pentru inserare în lucrare (Word/LaTeX)

### Cum convertești Mermaid → imagine pentru Word

**Opțiunea A — online (recomandat, zero install):**
1. Deschide [mermaid.live](https://mermaid.live)
2. Paste conținutul fișierului `.mmd`
3. Sus dreapta → **Actions → PNG / SVG download**
4. Inserează în Word: Insert → Picture

**Opțiunea B — local cu mmdc:**
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i docs/diagrams/01_schema_bloc.mmd -o fig_2_5_schema_bloc.png -w 1600 -H 1200
```

**Opțiunea C — în Obsidian/Notion/GitHub:**
Mermaid se randează automat în blocuri ` ```mermaid `.

### Numerotare figuri în Word

Pune fiecare imagine cu **Insert → Caption**. Word va numerota automat
(Figura 2.1, Figura 2.2, ...). Apoi la sfârșit folosește **References →
Insert Table of Figures** ca să generezi lista figurilor automat (ca la
Giulia, pagina 5).

---

**Spune-mi care prompt vrei să rulezi primul** sau dacă vrei să modifici
ceva la datele Gantt-ului (sunt cele mai personalizate).
