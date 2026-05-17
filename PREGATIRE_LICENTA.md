# Pregătire Susținere Licență — Întrebări și Răspunsuri

> Document de pregătire pentru întrebările care apar tipic la susținerea unei licențe pe FARO (aplicație de finanțe personale cu React + Node.js + PostgreSQL + Gemini AI).

Acest document anticipează întrebările probabile ale comisiei și oferă răspunsuri **argumentate**, nu doar buzzwords. La fiecare întrebare am inclus și **întrebări de follow-up** ca să fii pregătit pentru aprofundare.

---

## 1. SECURITATE ȘI CRIPTARE

> Acesta e capitolul cel mai des sondat. Comisia vrea să vadă că **înțelegi diferența între cifrare (encryption) și hashing**.

### Q1.1: Folosești criptare în aplicație? Ce fel?

**Răspuns scurt:** Da, în patru locuri distincte — fiecare cu un scop diferit. Important: **nu toate sunt "criptare" în sens propriu**. Folosesc trei tehnici diferite: **hashing** (one-way), **semnare digitală** (signing), și **TLS/HTTPS** (cifrare transport).

**Răspuns detaliat:**

1. **Hashing parole — bcrypt**
   - **Nu este criptare**, este *hashing one-way* — nu poți recupera parola din hash.
   - Folosesc librăria `bcryptjs` cu **cost factor 10** (2^10 = 1024 iterații).
   - Bcrypt include automat un **salt aleator** per parolă (16 bytes), stocat împreună cu hash-ul.
   - **De ce bcrypt și nu MD5/SHA-256?** MD5/SHA sunt rapide → vulnerabile la brute-force pe GPU. Bcrypt e lent intenționat (~100ms/parolă), face brute-force impracticabil.
   - **De ce salt?** Previne *rainbow table attacks*. Doi useri cu aceeași parolă au hash-uri complet diferite.

2. **Semnare token-uri — JWT (HS256)**
   - **Tehnic nu e criptare**, e **semnătură HMAC-SHA256**. Token-ul JWT este *signed*, nu *encrypted* — conținutul (payload-ul) este în clar (base64 decoded oricine îl poate citi).
   - **Semnătura garantează integritatea:** dacă cineva modifică payload-ul, semnătura nu se mai verifică.
   - Secret-ul HMAC trăiește **doar pe server** (`process.env.JWT_SECRET`). Fără el nu poți forja un token valid.
   - Două token-uri:
     - **Access token** (15 min TTL) — autentifică fiecare request.
     - **Refresh token** (7 zile TTL) — păstrat în cookie httpOnly, folosit doar pentru re-emitere access.

3. **Cifrare transport — TLS/HTTPS** (în producție)
   - Toate request-urile între client și server sunt cifrate cu **TLS 1.3** prin HTTPS.
   - Aici se aplică **AES-256-GCM** (cifrare simetrică) după handshake-ul ECDHE (Elliptic Curve Diffie-Hellman ephemeral) pentru schimbul de chei.
   - În dev rulez peste HTTP simplu (localhost) — în producție ar trebui un reverse proxy (Nginx/Caddy) cu certificat Let's Encrypt.

4. **Cifrare la rest — PostgreSQL**
   - PostgreSQL stochează datele pe disc neîncrate by default. În cloud (RDS, Supabase, etc.) volumul fizic e cifrat automat (AES-256) la nivel de storage layer.
   - **Nu cifrez câmpurile manual** (ex: descrierea tranzacției nu e cifrată în coloană). E o decizie conștientă: nu sunt date sensibile sub regulament GDPR strict (ex: nu numere de card).

**Follow-up: "Dar parola? Nu e date sensibile?"**
> Parola nu e niciodată stocată în clar. Hash-ul bcrypt este *one-way* — chiar dacă cineva ar avea acces la DB, nu poate inversa hash-urile pentru a obține parolele originale.

**Follow-up: "Dacă cineva îmi fură token-ul JWT?"**
> Risc real. De aceea:
> - Access token-ul are TTL scurt (15 min) — fereastră mică de exploatare.
> - Refresh token-ul e în cookie `httpOnly`, inaccesibil din JS — protejează contra atacurilor **XSS**.
> - Cookie-ul are `Secure` (doar HTTPS) și `SameSite=Strict` (nu se trimite cross-site) — protejează contra **CSRF**.

---

### Q1.2: De ce HMAC-SHA256 (HS256) și nu RSA (RS256) pentru JWT?

- **HS256** folosește o cheie secretă partajată (HMAC).
- **RS256** folosește criptografie asimetrică (cheie privată + publică).
- **Trade-off:** HS256 e mai rapid, dar necesită ca aceeași cheie să fie cunoscută de toate componentele care semnează/verifică. **Pentru aplicație monolitică (un singur backend)**, HS256 este suficient și mai simplu.
- **Când aș alege RS256?** Dacă am microservicii multiple care trebuie să verifice token-uri emise de un Auth Service central — atunci doar Auth Service are cheia privată, restul au doar cheia publică.

---

### Q1.3: Ce e mai exact diferența între hashing și criptare?

| Aspect | Hashing | Criptare |
|---|---|---|
| **Direcție** | One-way (nu poți recupera input-ul) | Reversibilă (cu cheia corectă) |
| **Output size** | Fix (ex: 60 bytes pentru bcrypt) | Variabil (proporțional cu input-ul) |
| **Scop** | Verificare identitate (parole, fingerprints) | Confidențialitate (date secrete) |
| **Exemple** | MD5, SHA-256, bcrypt, Argon2 | AES, RSA, ChaCha20 |

**În aplicația mea:**
- Parolele sunt **hash-uite** (bcrypt) — am nevoie să verific că parola dată la login matchuiește, nu să o recuperez.
- Datele în tranzit sunt **criptate** (TLS) — am nevoie ca server-ul să le poată decripta și citi.

---

### Q1.4: Protecții contra atacurilor comune?

| Atac | Vector | Protecție în aplicație |
|---|---|---|
| **SQL Injection** | Input nesanitizat în query SQL | **Prisma ORM** folosește parametrized queries — imposibil din construcție |
| **XSS (Cross-Site Scripting)** | JS injectat care fură date/cookie-uri | React escapă HTML automat în `{}`. Refresh token în cookie **httpOnly** (inaccesibil din JS) |
| **CSRF (Cross-Site Request Forgery)** | Browser-ul user-ului trimite request autentificat la cererea unui site malițios | Cookie cu `SameSite=Strict`. JWT access token nu se trimite automat (e în header explicit) |
| **Brute-force parolă** | Multe încercări de login | Rate limiting (`rate-limiter-flexible`) + cost bcrypt mare |
| **Replay attack pe token** | Reutilizarea unui token furat | TTL scurt (15 min). Refresh token rotation. |
| **Clickjacking** | UI-ul aplicației afișat în iframe pe alt site | Helmet setează `X-Frame-Options: SAMEORIGIN` |
| **MITM (Man-in-the-Middle)** | Interceptare trafic | HTTPS în producție |
| **Enumerarea conturilor** | Login eșuat dă mesaje diferite pentru "email greșit" vs "parolă greșită" | Aici am o vulnerabilitate intenționată (UX > security) — diferențiem pentru UX mai bun. În prod ar trebui mesaj generic |
| **Mass assignment** | User trimite câmpuri sensibile în PATCH (ex: `role: admin`) | Zod schema strictă — doar câmpurile validate ajung la Prisma |

---

### Q1.5: Cum stochezi datele utilizatorului? GDPR?

- **Parolele:** hash bcrypt, **nu pot fi recuperate**.
- **Email-ul, numele:** clar text în DB (necesare pentru funcționalitate).
- **Tranzacțiile:** clar text — sunt date personale dar nu există obligația de cifrare la nivel de câmp.
- **Ștergerea contului:** implementat real (`DELETE /api/users/me`) — șterge cascadat toate tranzacțiile, bugetele, categoriile, notificările. **Dreptul la ștergere (Art. 17 GDPR) este respectat.**
- **Dreptul la portabilitate (Art. 20 GDPR):** parțial — există export Excel/PDF al tranzacțiilor.

**Ce lipsește pentru GDPR full?**
- Politica de confidențialitate explicită.
- Consimțământ explicit la registration pentru procesarea datelor.
- Logging acces date (audit trail).
- Pentru proiect academic, am implementat **funcționalitățile**, nu **conformitatea legală formală**.

---

## 2. BAZA DE DATE

### Q2.1: De ce ai ales o bază de date relațională (PostgreSQL) și nu o bază NoSQL (MongoDB, etc.)?

**Răspuns:**

1. **Datele financiare au relații rigide și predictibile.** Un User are tranzacții, tranzacțiile aparțin unei categorii, categoria poate fi în mai multe bugete. Aceste relații nu se schimbă în timp — exact pentru asta sunt foreign keys în SQL.

2. **Integritatea referențială.** Dacă șterg o categorie, PostgreSQL nu mă lasă (foreign key constraint) decât dacă mut tranzacțiile în altă categorie sau le șterg. În MongoDB ar trebui să gestionez asta în cod, cu risc de inconsistență.

3. **Tranzacții ACID.** La crearea unei tranzacții recurente, expandez în 12 rânduri în Transaction. Ori se scriu toate, ori niciuna. `prisma.$transaction()` îmi garantează asta. NoSQL eventual-consistency ar fi un coșmar pentru date financiare.

4. **Queries agregate complexe.** "Suma cheltuielilor pe categorie pe luna asta" — în SQL e un `GROUP BY` simplu. În MongoDB ar fi un aggregation pipeline cu `$group`, `$match`, `$lookup` — funcționează dar e mult mai verbose.

5. **Schema cunoscută up-front.** Nu am nevoie de flexibilitatea unei baze schema-less. Schema mea de tranzacție nu se va schimba radical de la un user la altul.

**Ce am hibridizat?** Coloana `Transaction.receiptData` este `Json` (Postgres native JSON support). Pentru bonurile digitale extrase de OCR — fiecare bon are un număr variabil de produse — JSON e mai natural decât o tabelă separată `ReceiptItem`. **Beneficiez de relațional unde contează + JSON unde îmi face viața mai ușoară.**

---

### Q2.2: Ce este ACID?

**A**tomicitate, **C**onsistență, **I**zolare, **D**urabilitate.

- **Atomicitate** — o tranzacție DB se execută integral sau deloc. Ex: la create recurring, sau toate cele 12 instanțe se salvează, sau niciuna.
- **Consistență** — DB rămâne mereu într-o stare validă conform constrângerilor (FK, UNIQUE, CHECK).
- **Izolare** — două tranzacții simultane nu se influențează (nivel de izolare configurabil: Read Committed default în Postgres).
- **Durabilitate** — odată comisă, tranzacția supraviețuiește unui restart al serverului (WAL — Write-Ahead Log).

---

### Q2.3: Câte tabele ai? Care?

**6 tabele:**

1. **User** — conturi
2. **Category** — categorii (income/expense)
3. **Transaction** — toate veniturile și cheltuielile
4. **Budget** — plafoane lunare
5. **BudgetCategory** — *junction table* M:N între Budget și Category cu atribut (`limitAmount`)
6. **Notification** — notificări in-app

**Relații:**
- 1:N predominant (User-Transactions, User-Budgets, Category-Transactions)
- M:N între Budget și Category prin BudgetCategory

---

### Q2.4: Ce e normalizarea? Pe ce formă normală ești?

**Răspuns:** schema este în **a treia formă normală (3NF)**.

- **1NF:** fiecare câmp e atomic (nu am array-uri sau JSON arbitrare în câmpuri "logice"). Excepție: `receiptData` Json — dar conține date *descriptive*, nu *relaționale*.
- **2NF:** fiecare câmp non-key depinde de **întreaga** primary key (irelevant aici, am chei simple).
- **3NF:** nu am tranzitivități (un câmp non-key care depinde de alt câmp non-key). Ex: nu stochez `categoryName` în Transaction — fac JOIN cu Category.

**De ce nu mai înalt (BCNF/4NF)?** 3NF e suficient pentru orice aplicație de business. Mai mult ar însemna over-engineering.

---

### Q2.5: Ce indexuri ai? De ce?

**Indexuri compuse pe Transaction:**
```prisma
@@index([userId, date])
@@index([userId, recurringGroupId])
```

**Motivație:**
- Query-ul cel mai frecvent: "dă-mi tranzacțiile user-ului X pentru luna mai". Asta filtrează după `userId` + `date` între două valori. Indexul compus `(userId, date)` permite Postgres să găsească rapid range-ul.
- Pentru ștergerea în masă a unei serii recurente: `(userId, recurringGroupId)`.

**Indexuri implicite (din UNIQUE):**
- `User.email` (unique)
- `Budget(userId, month, year, isTotal)` (unique compus)
- `BudgetCategory(budgetId, categoryId)` (unique compus)

**De ce nu indexez tot?** Indexurile accelerează SELECT dar încetinesc INSERT/UPDATE (trebuie menținute) și consumă storage. Indexez **doar pattern-urile de query frecvente**.

---

### Q2.6: Cum gestionezi migrările schemei?

În dezvoltare folosesc **`prisma db push`** — sincronizează schema direct cu DB, fără migrare numerotată. Rapid pentru iterare.

În producție ar trebui **`prisma migrate deploy`** cu fișiere de migrare SQL versionate în Git, care se aplică ordonat la deploy.

---

### Q2.7: Float pentru sume monetare — nu e periculos?

**Da, e cunoscută problema.** Float-urile IEEE 754 nu reprezintă exact 0.1 (de ex. `0.1 + 0.2 !== 0.3`).

În aplicația mea sumele sunt în RON cu maxim 2 zecimale, iar mărimea realistă < 100.000 RON → erori sub `Number.EPSILON` în arithmetic. **Funcționează corect pentru scope-ul proiectului**.

**Pentru producție serioasă:** ar trebui `Decimal(12, 2)` din schema veche, sau o librărie ca `decimal.js`. **Compromisul a fost simplitate vs precizie pentru proiectul academic.**

---

## 3. ARHITECTURĂ

### Q3.1: De ce monorepo (frontend + backend + shared)?

- **Tipuri partajate** — definesc `Transaction`, `Budget` o singură dată în `shared/` și sunt folosite identic în ambele. Renaming în frontend → backend compilează cu eroare → previn API drift.
- **Commit atomic** — un feature care atinge frontend + backend e o singură PR / un singur commit.
- **Versionare lock-step** — nu e nevoie de versioning între package-uri.

**Alternativă:** repo-uri separate cu un package `@faro/shared` publicat pe npm. **Overhead inutil pentru proiect mic.**

---

### Q3.2: De ce REST și nu GraphQL / gRPC?

- **REST:** simplu, larg cunoscut, debugging ușor (poți face curl), cache-uire HTTP nativă.
- **GraphQL:** ar fi util dacă aveam UI-uri foarte diverse care cer date diferite. Pentru CRUD simplu pe entități predictibile → overkill.
- **gRPC:** util pentru microservicii intern; nu pentru browser → backend.

**Trade-off pe care l-am acceptat:** REST poate să trimită câmpuri inutile, sau să necesite mai multe round-trip-uri. **Pentru scale-ul aplicației — nesemnificativ.**

---

### Q3.3: De ce SPA (Single Page Application) și nu Server-Side Rendering?

- **SPA cu React** — separare clară client/server, interactivitate snappy, ideal pentru aplicație tip "dashboard" cu multă state.
- **SSR (Next.js)** — ar fi avantajos pentru SEO sau time-to-first-content. Aplicația mea **necesită login** — SEO irelevant.
- **Trade-off:** SPA înseamnă bundle JS mare la prima încărcare (530 KB la mine). Acceptabil pentru o aplicație de productivitate care e folosită zilnic.

---

### Q3.4: De ce ai separat backend de frontend? Nu puteai face totul în Next.js?

**Da, puteam.** Decizia de separare:
- **Backend Node.js independent** → poate alimenta și o aplicație mobilă în viitor (același API REST).
- **Skill-uri separate** — backend Express + Prisma e mai aproape de "backend industrial" decât backend-ul integrat al Next.js.
- **Pentru o licență, demonstrez stack-uri diferite** — mai bine din punct de vedere educațional.

---

## 4. FRONTEND

### Q4.1: De ce React și nu Vue / Angular / Svelte?

- **React** — cel mai mare ecosistem, cele mai multe job-uri, foarte robust pentru aplicații complexe.
- **Vue** — mai prietenos pentru începători, dar ecosistem mai mic.
- **Angular** — opinionated, mai complex, pentru aplicații enterprise mari.
- **Svelte** — compile-time, foarte performant, dar ecosistem mai mic.

**Decizia practică:** familiaritate + ecosistem (sunt o sută de mii de pachete care merg out-of-the-box).

---

### Q4.2: De ce Vite și nu Create React App / Webpack direct?

- **Vite:** dev server ESM nativ — pornește instant, HMR sub-secundă chiar și la 2000 de module.
- **CRA:** deprecat de Meta în 2023. Webpack lent în dev (bundle complet pe fiecare modificare).
- **Bundle de producție** la Vite folosește Rollup — optimizat.

---

### Q4.3: De ce React Query (TanStack Query)?

Rezolvă **server state** elegant:
- **Cache automat** după query key (`['transactions']`, `['statistics', 'overview']`).
- **Refetch în background** când fereastra primește focus.
- **Invalidate selectiv** după mutații.
- **Optimistic updates** — UI se actualizează instant, fără să aștepte server.
- **Deduplication** — două componente care cer aceleași date → un singur request.

**Alternativă:** Redux + RTK Query. Mai verbose. React Query e mai natural pentru pattern-ul "cere date de la server".

---

### Q4.4: De ce Zustand pentru client state?

Pentru state-ul de "client" (UI state, current user, access token) folosesc Zustand.
- **Mai simplu decât Redux** — fără reducers, fără actions, fără providers.
- **API minimalist** — store într-o funcție, hooks pentru consumare.
- **Server state e separat** (React Query) → store-ul Zustand rămâne mic.

---

### Q4.5: Cum gestionezi routing-ul?

`react-router-dom` v6 cu rute declarative.
- **Public routes:** `/login`, `/register`, `/forgot-password`
- **Protected routes:** restul — învelite într-un `<RequireAuth>` care verifică store-ul Zustand.
- **Deep links cu query params** — ex: `/transactions?category=<id>&from=...&to=...` pentru drill-down din Bugete.

---

### Q4.6: Cum afișezi graficele?

Două abordări:
1. **Recharts** — pentru grafice complexe (folosit punctual).
2. **SVG inline** — pentru chart-uri custom (donut, line chart pe Dashboard, sparkline-uri). **Avantaj:** control total, zero dependențe, performant, animații CSS.

Donut-ul din Dashboard este complet custom: calculez arc-uri cu `stroke-dasharray` pe `<circle>` în SVG.

---

## 5. BACKEND

### Q5.1: De ce Node.js și nu Java/Spring, Python/Django, Go?

- **Node.js** — same language ca frontend (JS/TS) → context switch zero, code sharing facil.
- **Java Spring** — mature dar verbose, startup lent. Ar fi over-engineering aici.
- **Python/Django** — productiv dar mai lent.
- **Go** — performant, dar ecosistem mai mic pentru web apps.

**Decizia:** TypeScript end-to-end → tipuri partajate, dev experience unificat.

---

### Q5.2: De ce Express?

- **Express:** standard de facto pentru Node, foarte well-known, middleware ecosystem uriaș.
- **Fastify** — alternativă mai rapidă, dar Express e mai familiar.
- **Nest.js** — opinionated, MVC + DI built-in, dar mai complex (decorators, modules) — overkill pentru proiectul ăsta.

---

### Q5.3: De ce Prisma și nu raw SQL / TypeORM / Sequelize?

- **Prisma:**
  - Schema declarativă într-un singur fișier.
  - Client generat **type-safe** — autocomplete pentru fiecare câmp, eroare la compile dacă query-ul e greșit.
  - Migrations versionate.
  - Prisma Studio — GUI pentru exploare DB.
- **TypeORM:** decorators-based, mai vechi, type safety mai slabă.
- **Sequelize:** OG ORM Node, JS-first, types adăugate ulterior.
- **Raw SQL:** maximum control, dar **zero type safety** între SQL și TS. Refactor riscant.

---

### Q5.4: De ce TypeScript și nu JavaScript pur?

- **Catch bugs la compile-time** — un câmp redenumit prinde eroare instant.
- **Refactor sigur** — IDE-ul știe unde să updateze.
- **Autocomplete** — productivitate +50%.
- **Documentație built-in** — tipurile sunt documentația.

Cost: build step suplimentar și complexitate de configurare. Acceptabil pentru orice proiect peste ~1000 LOC.

---

### Q5.5: Cum validezi input-urile?

**Zod** — schema declarativă care:
1. Validează runtime (la API entry).
2. Inferă tipuri TS automat (`z.infer<typeof schema>`).
3. Returnează erori cu mesaje în română.

```ts
const schema = z.object({
  amount: z.number().positive('Suma trebuie să fie pozitivă'),
  type: z.enum(['income', 'expense']),
});
// type Input = z.infer<typeof schema>;
```

**Beneficii:** singura sursă de adevăr pentru forma datelor.

---

## 6. AI / GEMINI

### Q6.1: Ce model AI folosești și de ce?

**`gemini-2.5-flash-lite`** de la Google.

**Argumentare:**
- **Multimodal** (text + imagine) — necesar pentru OCR bonuri.
- **Free tier generos:** 1000 requests/zi.
- **Latency mic** (~1-2s pentru text, ~3s pentru imagine).
- **Cunoaște limba română** out-of-the-box.

**Alternative considerate:**
- OpenAI GPT-4o — mai performant, dar plătit per token.
- Claude — performant dar API cost.
- Tesseract.js — open source, dar acuratețe slabă pe bonuri termice.

---

### Q6.2: Cum funcționează OCR-ul pentru bonuri?

1. User încarcă poza unui bon.
2. Frontend o convertește la base64.
3. Backend trimite imaginea + prompt structurat către Gemini.
4. Prompt-ul cere JSON cu schema fixă:
   ```json
   { "merchant": "...", "items": [...], "total": ... }
   ```
5. `responseMimeType: "application/json"` forțează output JSON valid.
6. Backend validează cu funcție `normalizeReceiptData()` și returnează.
7. Frontend afișează preview, user verifică, salvează.

**De ce nu Tesseract.js client-side?**
- ~10 MB pachet de limbă descărcat la prima utilizare.
- Acuratețe slabă pe fonturi termice românești.
- Nu extrage line items, doar text raw.

---

### Q6.3: Cum protejezi cheia API Gemini?

- **Cheia trăiește doar pe backend** (`process.env.GEMINI_API_KEY`).
- Frontend-ul **nu cunoaște cheia** — apelează backend-ul nostru, backend-ul apelează Gemini.
- Astfel un user rău intenționat **nu poate epuiza cota mea de free tier** direct.

---

### Q6.4: Ce alte feature-uri AI sunt în aplicație?

1. **Sugestie categorie** la introducerea unei tranzacții (după descriere). Ex: scrii "lidl" → suggest "Mâncare".
2. **Weekly Insight** — Gemini analizează săptămâna și generează 2-3 paragrafe de comentariu.
3. **Quick Tip** — sfat scurt actionabil pe Dashboard.
4. **AI Assistant Drawer** — chat liber, user întreabă orice despre finanțele lui.
5. **OCR bon fiscal** — extragere structurată.

Toate folosesc același model.

---

## 7. PERFORMANȚĂ ȘI SCALABILITATE

### Q7.1: Câți useri concurrenți poate suporta aplicația?

**Răspuns onest:**
- Pentru proiectul actual nu am făcut load testing.
- Un Node.js single-thread poate gestiona ~1000-5000 req/s pentru request-uri simple.
- Bottleneck-ul real ar fi DB-ul — depinde de connection pool (Prisma default 10).
- Pentru a scala: cluster Node.js (PM2), read replicas pe Postgres, cache Redis.

---

### Q7.2: Ce strategii de cache folosești?

1. **Frontend (React Query)** — cache in-memory cu stale-while-revalidate. Tranzacțiile încărcate o dată sunt cache-uite, refetch automat când navighezi.
2. **Backend (in-memory Map)** — pentru Weekly Insight cu TTL 24h. Evită apeluri Gemini repetate.
3. **Browser cache** — pentru CSS/JS bundle-uri (hash în filename).

---

### Q7.3: Pagination?

Da. Tranzacții — **10 per pagină** cu pager numerotat. Calculul se face client-side din lista totală (acceptabil pentru < 1000 tranzacții). Pentru scale mai mare ar trebui server-side pagination cu `LIMIT/OFFSET` sau cursor-based.

---

### Q7.4: Cum ai scala aplicația pentru 100k useri?

1. **DB read replicas** — separa queries de read de cele de write.
2. **Connection pooling** — PgBouncer.
3. **Cache layer** — Redis pentru: sesiuni, statistici precalculate.
4. **CDN** pentru asset-uri.
5. **Worker queue** (BullMQ) pentru job-uri async (OCR-uri lente, generare PDF-uri).
6. **Horizontal scaling** — multiple instanțe Node în spatele unui load balancer.
7. **Object storage** pentru bonuri (Cloudflare R2).
8. **Monitoring** — Prometheus + Grafana, Sentry pentru erori.

**Important:** nu am implementat astea — sunt aspecte de producție. Le menționez ca **understanding al limitelor actuale**.

---

## 8. TESTARE

### Q8.1: Ai teste? Ce tip?

Da, **unit teste** cu **Vitest** pentru servicii critice:
- `BudgetValidator` — verificarea depășirii bugetului.
- `RecurringTransactionEngine` — generarea instanțelor recurente.
- `parseReceiptText` (legacy din Tesseract era) — extragere amount/date/merchant din text.

**Lipsesc:**
- Integration tests pentru API.
- E2E tests (Playwright/Cypress).
- Snapshot tests pentru componente React.

**Justificare onest:** focus pe livrare funcțională în timp limitat. Testele sunt acolo unde valoarea/risc raport e maxim — logica de business critică.

---

## 9. DECIZII DE DESIGN

### Q9.1: De ce ai făcut auto-save după OCR și apoi ai schimbat la preview?

**Inițial:** auto-save după scan dacă OCR returna sumă + categorie. Argument: "scan = expense added" (mental model Lidl Plus).

**Schimbare:** user a cerut explicit preview înainte de save. Argument: AI poate greși (sumă citită greșit, categorie sugerată proastă) → user trebuie să verifice. Preview-ul îi dă control.

**Lecție:** auto-magic features pot fi frustrant. **User-in-control e mai sigur.**

---

### Q9.2: De ce nu salvezi poza bonului pe disk în plus față de JSON?

**Inițial salvam.** Probleme:
- **Storage ephemeral pe majoritatea platformelor cloud** — pozele dispar la restart.
- **Privacy** — bonurile pot conține date sensibile (adresa magazinului, ora, etc.).
- **Cost cloud storage** la scale.

**Decizia:** doar JSON structurat (`~1 KB` per bon vs `~2-3 MB`). Avem suficiente date pentru a randa un "bon digital" fără poză.

**Trade-off acceptat:** nu mai există audit trail vizual. În producție serioasă probabil aș salva poza într-un bucket R2/S3 cu lifecycle policy (ștergere după 90 de zile).

---

### Q9.3: De ce ai eliminat CSV import?

User-ul a cerut. Motivație practică:
- **Funcționalitate redundantă** cu OCR bonuri pentru fluxul tipic.
- **Categoriile trebuie mapate manual** la fiecare import — UX prost.
- **Cod nefolosit** = bug-uri potențiale + maintenance.
- **Cleanup-ul a redus bundle-ul cu ~12 KB.**

---

## 10. ÎNTREBĂRI METAFIZICE

### Q10.1: Ce ai fi făcut diferit dacă o luai de la zero?

- **Decimal pentru sume** de la început.
- **Migrations versionate** cu `prisma migrate dev` în loc de `db push`.
- **Tests-first** pentru logica critică (budgets, recurring).
- **Storybook** pentru componente.
- **Logging structurat** (Pino) în loc de morgan.

---

### Q10.2: Care e cea mai grea problemă tehnică pe care ai rezolvat-o?

**Sincronizarea optimistă a notificărilor cu invalidarea selectivă a query-urilor React Query.**

Bell-ul afișa instant 0 unread la click (optimistic update), dar apoi nu se actualiza când o tranzacție nouă crea o notificare backend. Cauza: mutația de create transaction nu invalida `['notifications']`. Trebuia coordonare între:
1. Optimistic update pe client (Zustand-style).
2. Invalidare după mutație.
3. Polling background (refetchInterval).

Soluție: invalidare explicită în onSuccess al fiecărei mutații care poate genera o notificare.

**Bonus:** am descoperit pe parcurs că backend-ul nu mai crea notificări noi pentru depășiri repetate (din cauza dedupe-ului care căuta unread existent) — fix a fost să las dedupe doar pentru `budget_near_limit`.

---

### Q10.3: Cum ai integrat AI? Nu doar "ca buzzword"?

AI-ul rezolvă **probleme concrete** unde algoritmii tradiționali ar fi mult mai complecși:
1. **OCR bonuri** — algoritmi clasici de OCR (Tesseract) au acuratețe slabă pe fonturi termice + diacritice. Gemini citește bonuri ca un om.
2. **Categorisare automată** — clasificare text supervised ar necesita training set + retraining. Gemini are "common sense" out-of-the-box ("lidl" → mâncare, fără să-i spun).
3. **Insights** — generare de limbaj natural personalizat. Imposibil cu reguli statice.

**Important:** AI-ul e un *enhancement*, nu *core dependency*. Aplicația funcționează fără el (user introduce manual datele).

---

## 11. RAPID-FIRE — RĂSPUNSURI SCURTE

| Întrebare | Răspuns |
|---|---|
| Limbaj? | TypeScript (frontend și backend) |
| Framework frontend? | React 18 + Vite |
| Framework backend? | Express + Prisma |
| Bază de date? | PostgreSQL 18 (relațională) |
| Tip de bază de date? | RDBMS |
| Auth method? | JWT dual-token (access + refresh) |
| Password hashing? | bcryptjs, cost 10 |
| OAuth providers? | Google, Facebook (via Passport.js) |
| AI provider? | Google Gemini 2.5 Flash Lite |
| Validare input? | Zod |
| State management frontend? | React Query (server) + Zustand (client) |
| Routing? | react-router-dom v6 |
| Styling? | CSS custom properties (no Tailwind) |
| Charts? | SVG inline + Recharts |
| Toasts? | Sonner |
| Icons? | Lucide React |
| Excel export? | ExcelJS |
| PDF export? | PDFKit |
| Câte tabele DB? | 6 |
| Câte module backend? | 10 |
| HTTPS în prod? | Da (recomandat — TLS 1.3) |
| Rate limiting? | rate-limiter-flexible |
| Tests? | Vitest (unit) |
| Build tool? | Vite (frontend), tsc (backend) |

---

## 12. ÎNTREBĂRI CAPCANĂ — PREGĂTIRE

> Întrebări care sună inocent dar testează profunzimea.

### "Care e diferența între autentificare și autorizare?"
- **Autentificare:** "Cine ești?" — verificare identitate (login).
- **Autorizare:** "Ce ai voie să faci?" — verificare permisiuni (poți accesa resursa X?).

În aplicația mea: autentificarea = JWT verificat. Autorizarea = fiecare query filtrat după `userId` din JWT → un user nu poate accesa tranzacțiile altuia.

### "JWT-ul tău e stateless. Cum dezactivezi un user?"
**Limitarea reală a JWT-ului.** Nu poți "expira" un JWT activ — trebuie să aștepți TTL-ul.

Soluții posibile:
- **Blacklist server-side** (Redis cu ID-urile token-urilor revocate).
- **Refresh token rotation** — revoci refresh-ul, access-ul curent expiră în 15 min.
- **Schimbare a JWT_SECRET** — invalidează toate token-urile (drastic, deloghează toată lumea).

Eu folosesc varianta a 2-a implicit prin TTL scurt.

### "Ce se întâmplă dacă DB-ul e jos?"
- Toate request-urile API întorc 500.
- Frontend-ul afișează un toast de eroare.
- **Nu am circuit breaker** — un fail rapid e ok pentru o app cu un singur backend.
- **Nu am queue de retry** — pentru o app reală, mutațiile importante ar trebui re-încercate.

### "Cum gestionezi timezone-uri?"
**Problemă cunoscută rezolvată în proiect.** Postgres stochează DateTime ca UTC. JavaScript parse-uiește `"2026-05-17"` ca UTC midnight, care în România = 03:00 local time. Fix: afișez `createdAt` (timestamp complet) pentru ora reală în UI.

### "Componenta cu cele mai multe linii din proiect?"
`Transactions.tsx` — ~2000 linii. **Cunosc problema** — ar trebui split în sub-componente. Dar e funcțional și clar (totul legat de tranzacții într-un loc).

### "Diferența între cookies, localStorage, sessionStorage?"
| | Cookies | localStorage | sessionStorage |
|---|---|---|---|
| Trimis automat în req | Da | Nu | Nu |
| Accesibil din JS | Da (dacă nu httpOnly) | Da | Da |
| Durata | Configurabilă | Permanent | Tab session |
| Mărime | ~4 KB | ~5-10 MB | ~5-10 MB |

Refresh token-ul meu: cookie httpOnly. Access token: în memorie (Zustand). **Nu folosesc localStorage pentru token-uri** — vulnerabil XSS.

---

## 13. SFATURI GENERALE PENTRU SUSȚINERE

1. **Nu zice "merge" — explică DE CE merge.** Comisia vrea să vadă raționament.
2. **Recunoaște compromisurile.** "Am ales X pentru Y, dar dezavantajul e Z." Asta demonstrează maturitate.
3. **Cunoaște limitele aplicației tale.** "În producție ar trebui adăugat W." e răspuns acceptabil.
4. **Demo-ul rămâne demo.** Concentrează-te pe **decizii** și **arhitectură** când vorbești.
5. **Răspunde direct.** Dacă nu știi, "nu am studiat în detaliu, dar înțeleg că..." e mai bine decât a inventa.
6. **Vorbește încet și clar.** Nu te grăbi.

---

**Succes la susținere! 💪**

Pentru orice întrebare specifică pe care vrei să o aprofundezi suplimentar, întreabă-mă acum și pregătim un răspuns dedicat.
