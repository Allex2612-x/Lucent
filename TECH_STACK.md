# FARO — Documentație Tehnică

> Aplicație web pentru managementul finanțelor personale: înregistrare tranzacții (cu OCR pentru bonuri fiscale), bugete pe categorii, statistici lunare, rapoarte exportabile, asistent AI și notificări.

Acest document descrie complet stack-ul tehnologic, arhitectura, modelul de date și deciziile de design.

---

## 1. Arhitectura generală

Aplicația este organizată ca un **monorepo** cu trei pachete partajate (`frontend`, `backend`, `shared`), comunicând prin **HTTP REST**.

```
sasha_licenta/
├── frontend/          # SPA React + Vite (port 5173 în dev)
├── backend/           # API REST Express + Prisma (port 4000 în dev)
└── shared/            # Tipuri TypeScript partajate (workspace package)
```

**Pattern arhitectural:** *Client-Server cu separare strictă*. Frontend-ul nu accesează niciodată baza de date direct; toată logica de business trăiește în backend. Comunicarea este stateless (JWT în Authorization header + refresh token în cookie httpOnly).

**Modul de business pe backend (`backend/src/modules/`):**
- `auth` — autentificare locală + OAuth (Google, Facebook)
- `user` — profil, parolă, ștergere cont
- `category` — categorii (default globale + user-defined)
- `transaction` — CRUD tranzacții, OCR bonuri, recurring
- `budget` — bugete lunare totale și pe categorii
- `notification` — notificări in-app (clopoțel)
- `statistics` — agregate (overview, by-category, monthly-trend, anomalies)
- `report` — export PDF + Excel
- `insights` — AI insights (Weekly Insight, Quick Tip, recomandări, Q&A)

---

## 2. Stack tehnologic

### Frontend

| Tehnologie | Versiune | Rol |
|---|---|---|
| **React** | 18.3 | Bibliotecă UI declarativă |
| **TypeScript** | 5.5 | Tipare statică pentru codul JS |
| **Vite** | 5.3 | Bundler și dev server (HMR rapid, ESM nativ) |
| **React Router** | 6.24 | Routing client-side (`/dashboard`, `/transactions`, etc.) |
| **TanStack Query** (React Query) | 5.51 | Cache pentru cererile API, refetch, invalidate, optimistic updates |
| **Zustand** | 4.5 | State management global (auth user, access token) |
| **Axios** | 1.7 | HTTP client (cu interceptors pentru auth + refresh) |
| **Lucide React** | 0.408 | Set de icoane line-style |
| **Recharts** | 2.12 | Grafice (folosit punctual; majoritatea graficelor sunt SVG inline) |
| **date-fns** | 3.6 | Manipulare date |
| **Sonner** | 2.0 | Toast notifications |
| **clsx** | 2.1 | Helper pentru clase CSS condiționale |

**Styling:** CSS pur cu **CSS Custom Properties** (variabile pentru theming). Mod întunecat implementat via `html[data-theme="dark"]`.

### Backend

| Tehnologie | Versiune | Rol |
|---|---|---|
| **Node.js** | 24.14 | Runtime JavaScript pe server |
| **TypeScript** | latest | Tipare statică |
| **Express** | latest | Framework HTTP minimal |
| **tsx** | latest | Rulează TypeScript fără build separat în dev (`tsx watch`) |
| **Prisma** | 6.4 | ORM type-safe (schema → migrare → client generat) |
| **Zod** | latest | Validare runtime + inferare tipuri TypeScript |
| **JWT (jsonwebtoken)** | latest | Token-uri de acces și refresh |
| **bcryptjs** | latest | Hashing parole (bcrypt cu cost factor 10) |
| **Passport.js** | 0.7 | Strategy pattern pentru OAuth |
| **passport-google-oauth20** | 2.0 | Sign-in cu Google |
| **passport-facebook** | 3.0 | Sign-in cu Facebook |
| **helmet** | latest | HTTP security headers (CSP, HSTS, XSS, etc.) |
| **cors** | latest | Configurare Cross-Origin |
| **cookie-parser** | latest | Citire cookie-uri (folosit pentru refresh token) |
| **morgan** | latest | Logging HTTP în dev |
| **rate-limiter-flexible** | latest | Rate limiting (pe IP / pe user) |
| **dotenv** | latest | Variabile de mediu din `.env` |
| **PDFKit** | latest | Generare rapoarte PDF |
| **ExcelJS** | latest | Generare rapoarte Excel (`.xlsx`) |

### AI / OCR

| Serviciu | Model | Rol |
|---|---|---|
| **Google Gemini** | `gemini-2.5-flash-lite` | OCR bonuri fiscale (multimodal, image + text), categorisare automată tranzacții din descriere, Weekly Insights, Quick Tips, recomandări, Q&A. Free tier 1000 RPD. |

SDK: `@google/generative-ai` (oficial).

### Bază de date

| Tehnologie | Versiune | Tip |
|---|---|---|
| **PostgreSQL** | 18.3 | **Relațională (RDBMS)** |

**De ce o bază de date relațională?**
- Datele financiare au relații strict definite (User → Transactions → Categories → Budgets) și beneficiază de **integritate referențială** prin foreign keys.
- Queries agregate sunt frecvente (sumă cheltuieli pe categorie, evoluție lunară) și SQL e excelent la asta.
- Tranzacții ACID — esențial pentru o aplicație financiară (rollback la eroare).
- Schema cunoscută up-front, nu am nevoie de flexibilitatea unei baze NoSQL.

**Hibridizare relațional + JSON:** Pentru bonurile digitale (line items extrase de OCR) folosesc o coloană `Json` (`Transaction.receiptData`) în Postgres. Astfel păstrez **relaționalul pentru întreg modelul de business** dar capătă flexibilitate pentru date structurate variabile (un bon poate avea 1 sau 50 de produse). Postgres oferă oricum operatori native pentru JSON (`->`, `->>`, `@>`).

**Tipuri de date critice:**
- `Float` pentru sume monetare (în Romania toate cifrele sunt RON și nu avem precision issues sub 100k RON; pentru producție serioasă recomand `Decimal(12,2)` — schema veche îl folosea, dar Prisma + JS = mult overhead).
- `DateTime` cu tratare timezone-aware în UI (vezi secțiunea Timezone).
- `Boolean`, `Int`, `String` standard.

---

## 3. Modelul de date

Schema completă (Prisma DSL) — vezi `backend/prisma/schema.prisma`.

### Entități și relații

```
User (1) ────< (N) Category   [user-defined, plus categorii default globale]
User (1) ────< (N) Transaction
User (1) ────< (N) Budget
User (1) ────< (N) Notification

Budget (1) ────< (N) BudgetCategory (>──── 1) Category
                                   [tabelă de legătură M:N]

Transaction (N) ────> (1) Category
```

**6 tabele:**

| Tabel | Rol | Indexuri principale |
|---|---|---|
| `User` | Cont utilizator | `email` (unique) |
| `Category` | Categorii income/expense (default + user) | — |
| `Transaction` | Toate veniturile + cheltuielile | `(userId, date)`, `(userId, recurringGroupId)` |
| `Budget` | Plafoane lunare (total sau pe categorii) | `(userId, month, year, isTotal)` unique |
| `BudgetCategory` | Limite per categorie într-un buget | `(budgetId, categoryId)` unique |
| `Notification` | Notificări in-app (clopoțel) | — |

### Constrângeri și reguli de business

- **Unique:** `User.email`, `(Budget.userId, month, year, isTotal)`, `(BudgetCategory.budgetId, categoryId)`.
- **Foreign keys** cu `onDelete: Cascade` selectiv (budget category șters la ștergere buget).
- **Categorii default** au `userId = null` și `isDefault = true` — vizibile tuturor, ne-editabile.
- **Recurring transactions** sunt expandate la create-time în multiple rânduri identice cu `recurringGroupId` partajat, plus `sequenceNumber`.
- **`User.budgetNotifications`** controlează dacă backend-ul mai creează notificări în clopoțel pentru depășiri de buget (avertismentul pop-up la salvare rămâne mereu activ).

### Migrări

Folosesc **`prisma db push`** în dev (sincronizează schema fără shadow DB), iar `prisma migrate dev` pentru migrări numerotate când e nevoie.

---

## 4. API REST

### Convenții

- Base path: `/api`
- Auth: **JWT Bearer** în header `Authorization: Bearer <token>` pentru cele mai multe rute. Refresh token-ul se stochează în cookie `httpOnly`.
- Răspuns standard: `{ success: boolean, data: T, message?: string }`
- Erori validate cu Zod → 400 cu detalii pe câmpuri.
- Status codes folosite: 200, 201, 204, 400, 401, 403, 404, 409 (conflict — depășire buget), 500.

### Endpoints (selecție)

**Auth — `/api/auth/*`**
- `POST /register` — creare cont
- `POST /login` — login (returnează `accessToken` + setează refresh cookie)
- `POST /logout`
- `POST /refresh` — obține nou access token din refresh cookie
- `POST /forgot-password`, `POST /reset-password`
- `GET /providers` — verifică ce OAuth providers sunt configurate
- `GET /google`, `GET /google/callback` — OAuth Google
- `GET /facebook`, `GET /facebook/callback` — OAuth Facebook

**Users — `/api/users/*`**
- `GET /me`, `PATCH /me`, `PATCH /me/password`, `DELETE /me`

**Categories — `/api/categories/*`**
- `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`
- `GET /suggest?description=<str>&type=<income|expense>` — sugerează categorie via Gemini

**Transactions — `/api/transactions/*`**
- `GET /`, `GET /:id`, `POST /` (cu query `?force=true` pentru depășire buget), `PATCH /:id`, `DELETE /:id` (cu `?deleteFuture=true` pentru serii recurente)
- `POST /scan-receipt` — OCR bon fiscal via Gemini multimodal

**Budgets — `/api/budgets/*`**
- `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`

**Statistics — `/api/statistics/*`**
- `GET /` — overview lunar (totalIncome, totalExpenses, balance, transactionCount)
- `GET /by-category` — agregat pe categorii
- `GET /monthly-trend?months=12` — trend pe N luni
- `GET /anomalies` — tranzacții anormale (Z-score ≥ 2 față de media istorică)

**Insights — `/api/insights/*`**
- `GET /weekly` — insight săptămânal generat de Gemini (cached 24h)
- `GET /tip` — sfat scurt actionabil (cached)
- `GET /recommendations` — recomandări lunare
- `POST /ask` — întrebare liberă în AI Assistant Drawer

**Notifications — `/api/notifications/*`**
- `GET /`, `GET /unread-count`, `PATCH /:id/read`, `PATCH /read-all`

**Reports — `/api/reports/*`**
- `GET /export/pdf?startDate=...&endDate=...` — PDF generat cu PDFKit
- `GET /export/excel?startDate=...&endDate=...` — XLSX cu ExcelJS

---

## 5. Autentificare și securitate

### Modelul de auth

**Dual-token JWT:**
1. **Access token** (15 min TTL) — în memorie pe client (Zustand), trimis ca `Authorization: Bearer`.
2. **Refresh token** (7 zile TTL) — în cookie `httpOnly` `Secure` `SameSite=Strict`. Inaccesibil din JS — protejează contra XSS.

**Flow:**
- Login → primește access + setează refresh cookie.
- Pe 401: axios interceptor apelează `POST /auth/refresh` → primește nou access token → retry request original.
- Cookie-ul `httpOnly` previne furtul refresh token-ului de către scripturi terțe.

**OAuth:** Passport cu strategiile Google și Facebook. Provider-ul callback → backend creează/găsește user → emite same token pair.

### Hashing parole

`bcryptjs` cu cost factor 10 (~100ms/parolă pe hardware modern). Salted automat.

### Securitate HTTP

- **helmet** — setează automat: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`, etc.
- **CORS** — whitelist explicit pe `localhost:5173` + `process.env.FRONTEND_URL`. `credentials: true` pentru cookie-uri.
- **Cross-Origin-Resource-Policy** — setat la `cross-origin` ca să permită încărcarea asset-urilor statice (`/uploads/*`) de pe alt port în dev.
- **Validare input** — Zod la fiecare endpoint, schema partajată între create și update (`.partial()`).
- **Rate limiting** — `rate-limiter-flexible` (configurat în middleware).

### Protecții la nivel de business

- **Verificare ownership** — fiecare query este filtrat după `userId` din JWT. Un user nu poate accesa tranzacții ale altui user nici cu ID corect.
- **Force flag** la POST transaction — backend întoarce 409 dacă depășește bugetul; frontend afișează dialog; user confirmă → trimite din nou cu `?force=true`.

---

## 6. AI: Google Gemini Integration

### Model folosit
`gemini-2.5-flash-lite` — alegere bazată pe:
- Free tier generos (1000 requests/zi)
- Multimodal (text + image input) — necesar pentru OCR bonuri
- Latency mic (sub 2s pentru majoritatea request-urilor)
- Suport bun pentru română

### Use case-uri

**1. OCR bon fiscal (`receipt-scanner.service.ts`)**
- Input: imagine base64 + mimeType.
- Prompt structurat care cere JSON cu schema fixă (merchant, address, date, time, items[], subtotal, vat, total, paymentMethod, currency).
- `responseMimeType: "application/json"` forțează output JSON valid.
- Output: structură TypeScript validată cu `normalizeReceiptData()`.

**2. Sugestie categorie din descriere (`categories.service.ts`)**
- Input: descriere text + tip (income/expense) + lista categoriilor user-ului.
- Output: `{ categoryId, confidence }`.
- Cache implicit pe frontend prin React Query.

**3. Weekly Insight (`insights.service.ts`)**
- Input: agregat săptămânal + lunar (top categorii, cheltuieli vs venituri, comparat cu săpt anterioară).
- Output: text Markdown cu 2-3 paragrafe de insight.
- **Cache in-memory pe server** (Map) cu TTL 24h per user.

**4. Quick Tip + Recommendations + Ask (AI Assistant Drawer)**
- Tip: o frază scurtă cu sfat financiar.
- Ask: Q&A liber — user întreabă, backend trimite contextul (summary luna curentă) + întrebarea către Gemini.

---

## 7. OCR și bonuri digitale

### De ce nu Tesseract.js?

Versiunea inițială folosea **Tesseract.js** client-side. Probleme:
- ~10 MB language pack descărcat la prima utilizare.
- Acuratețe slabă pe bonurile termice românești (TOTAL DE PLATĂ, diacritice, fonturi distorsionate).
- Nu putea extrage line items, doar text raw → regex fragile.

### Soluția actuală

Backend trimite imaginea direct la Gemini cu un prompt structurat care cere JSON. Gemini returnează **întreaga structură a bonului**:

```json
{
  "merchant": "Lidl",
  "address": "Bd. Magheru 12, București",
  "date": "2026-05-17",
  "time": "14:32",
  "items": [
    { "name": "PAINE TOAST", "qty": 1, "unitPrice": 5.99, "total": 5.99 },
    { "name": "LAPTE 1L", "qty": 2, "unitPrice": 6.50, "total": 13.00 }
  ],
  "subtotal": 18.99,
  "vat": 1.52,
  "total": 20.51,
  "paymentMethod": "card",
  "currency": "RON"
}
```

JSON-ul este salvat în coloana `Transaction.receiptData` (Json, ~1 KB) — **nu salvăm poza originală**, doar datele structurate. Asta elimină nevoia de cloud storage în producție (S3, R2 etc.).

Frontend-ul randează un "bon digital" stilizat (header magazin → linii produse cu cantități și prețuri → separator punctat → totaluri în bold → metoda de plată), inspirat din aplicația Lidl Plus.

---

## 8. Validare și type-safety end-to-end

### TypeScript peste tot

Atât frontend cât și backend sunt 100% TypeScript. Pachetul `shared/` exportă tipuri partajate (Transaction, Budget, Category, User) care sunt referențiate din ambele părți.

### Runtime validation cu Zod

Fiecare payload de input pe backend trece prin schema Zod:
```ts
const createTransactionSchema = z.object({
  amount: z.number().positive('Suma trebuie să fie pozitivă'),
  type: z.enum(['income', 'expense']),
  date: z.string().or(z.date()).transform(val => new Date(val)),
  categoryId: z.string().uuid('ID categorie invalid'),
  // ...
}).refine(/* business rules */);
```

Beneficii:
- Mesaje de eroare în română (vizibile pentru utilizator).
- Tipul TS inferat automat (`z.infer<typeof schema>`).
- Transformări custom (string date → Date object).

### React Query — invalidări coordonate

Fiecare mutație care modifică datele invalidează query keys relevante:
- Create transaction → invalidează `['transactions']`, `['statistics']`, `['notifications']`.
- Update budget → invalidează `['budgets']`.

Optimistic updates folosite pentru: marcarea notificărilor ca citite (dot-ul dispare instant).

---

## 9. Probleme și soluții notabile

### Timezone (UTC vs Local Time)

`Date` în PostgreSQL se stochează ca UTC. Tranzacțiile create doar cu data (fără oră) se transformă în UTC midnight. În România, UTC midnight = 03:00 local. Soluție: afișarea folosește `createdAt` (timestamp complet cu ora reală a creării) în loc să parseze data ca local.

### Prisma Decimal serialization

`Decimal` din Prisma serializează ca string în JSON. Compararea `0 + Decimal` în JS face concatenare string. Toate sumele sunt convertite explicit la `Number()` la frontiera DB → JS.

### Cross-origin static assets

Backend-ul rulează pe `:4000`, frontend pe `:5173`. Helmet pune default `Cross-Origin-Resource-Policy: same-origin` care blochează poze stochate pe backend din `<img src=...>` în frontend. Setat la `cross-origin`.

### Helmet CSP

Disabled în dev pentru a permite HMR Vite. În producție trebuie reactivat cu policy strict.

---

## 10. Build și deployment

### Dev

```bash
# Terminal 1 — backend
cd backend
npm run dev          # tsx watch src/server.ts → port 4000

# Terminal 2 — frontend
cd frontend
npm run dev          # vite → port 5173 (proxy /api → :4000)
```

### Production build

**Frontend:** `npm run build` → `tsc -b && vite build` → output în `dist/` (~530 KB JS, 157 KB gzipped + ~23 KB CSS).

**Backend:** `npm run build` → `tsc -p tsconfig.json` → output în `dist/` → rulat cu `node dist/server.js`.

### Variabile de mediu critice

```bash
# Backend .env
DATABASE_URL=postgresql://user:pass@localhost:5432/sasha_licenta_dev
JWT_SECRET=<random 32+ chars>
REFRESH_TOKEN_SECRET=<random 32+ chars>
GEMINI_API_KEY=<Google AI Studio key>
GOOGLE_CLIENT_ID=<OAuth>
GOOGLE_CLIENT_SECRET=<OAuth>
FACEBOOK_APP_ID=<OAuth>
FACEBOOK_APP_SECRET=<OAuth>
FRONTEND_URL=https://app.faro.example  # pentru CORS în prod
```

---

## 11. Tooling și dev experience

- **ESLint + TypeScript strict** — caught most issues at compile time.
- **Vitest** — unit tests pentru servicii critice (BudgetValidator, RecurringTransactionEngine, parseReceiptText).
- **tsx watch** — backend reload automat la fiecare salvare.
- **HMR Vite** — frontend update instant fără pierdere de state.
- **Git workflow** — feature branches în `worktrees/`, merge în `main`, commit-uri descriptive cu co-author.

---

## 12. Considerații pentru producție

Aspecte nedone deliberate (proiect academic):
- **Migrare la `Decimal` din `Float`** pentru sume monetare.
- **Object storage pentru poze bon** (Cloudflare R2 / S3) — actualmente nu salvăm pozele deloc, dar dacă vrem audit trail va fi necesar.
- **Rate limiting strict** pe endpoint-urile Gemini (cost protection).
- **Logging structurat** (Pino / Winston) în loc de Morgan.
- **Monitoring** (Sentry / OpenTelemetry).
- **CI/CD pipeline** (GitHub Actions).
- **Migrare la `prisma migrate deploy`** în loc de `db push`.

---

## 13. Sumar rapid

- **Limbaj:** TypeScript end-to-end
- **Frontend:** React 18 + Vite + React Query + Zustand + React Router
- **Backend:** Node.js + Express + Prisma
- **DB:** PostgreSQL (**relațională**), cu coloană JSON pentru bonurile digitale
- **Auth:** JWT dual-token + Passport pentru OAuth (Google, Facebook)
- **AI:** Google Gemini 2.5 Flash Lite (OCR + insights + sugestii)
- **Validare:** Zod (runtime) + TypeScript (compile-time)
- **Securitate:** helmet, bcrypt, cookies httpOnly, CORS whitelist, rate limiting
- **Export:** PDFKit + ExcelJS
- **Stil:** CSS custom properties + dark mode
- **Total tabele DB:** 6
- **Total module backend:** 10
- **Total feature-uri frontend:** 7 (Dashboard, Transactions, Budgets, Categories, Reports, Settings, Auth)
