# Ghid — Secvențe de cod în LICENTA.docx

> Acest document explică **unde** trebuie introdusă fiecare secvență de cod în lucrarea de licență, **ce demonstrează** și **de unde provine** (fișierul sursă din proiect). Versiunea regenerată a `LICENTA.docx` (din momentul commit-ului care însoțește acest ghid) le conține deja pe toate.
>
> Total: **18 secvențe de cod** distribuite pe Capitolul 4 (Proiectarea în detaliu), unde au cel mai mare impact didactic.

---

## De ce sunt importante secvențele de cod în lucrare

Comisia de licență vrea să vadă două lucruri:
1. **Că înțelegi codul pe care l-ai scris** — nu doar că ai folosit framework-uri, ci că poți explica linie cu linie ce face.
2. **Că ai folosit pattern-uri corecte** — fiecare snippet trebuie să arate o decizie de design (validare cu Zod, parametrized SQL, JWT signing, etc.).

Cei mai mulți studenți pun cod doar la 2-3 funcționalități. **Tu vei avea cod la 18 locuri**, ceea ce demonstrează profunzime tehnică reală — exact ce vrea comisia să vadă.

---

## Tabel rapid: Lista celor 18 secvențe

| # | Secțiunea LICENTA | Subiect | Sursa în proiect | Linii |
|---|---|---|---|---|
| 1 | 4.1 Considerații implementare | Validare env cu Zod | `backend/src/config/env.ts` | ~15 |
| 2 | 4.4 — Autentificare | Hash parolă + login (bcrypt) | `auth.service.ts` | ~10 |
| 3 | 4.4 — Autentificare | Generare JWT dual-token | `auth.service.ts` | ~6 |
| 4 | 4.4 — Autentificare | Cookie httpOnly + refresh rotation | `cookies.ts` | ~15 |
| 5 | 4.4 — Autentificare | Axios interceptor pe 401 | `frontend/services/api.ts` | ~20 |
| 6 | 4.4 — Resetare parolă | Generare token + hash SHA-256 | `password-reset.service.ts` | ~15 |
| 7 | 4.4 — Resetare parolă | Send email cu Resend | `email.ts` | ~15 |
| 8 | 4.4 — Validare buget | Algoritm `checkBudget` | `budget-validator.ts` | ~20 |
| 9 | 4.4 — OCR Bonuri | Prompt structurat Gemini | `receipt-scanner.service.ts` | ~15 |
| 10 | 4.4 — OCR Bonuri | Apel multimodal + parse JSON | `receipt-scanner.service.ts` | ~15 |
| 11 | 4.4 — Recurring | Algoritm `generateInstances` | `recurring-transaction-engine.ts` | ~20 |
| 12 | 4.4 — Recurring | Salvare atomică cu `prisma.$transaction` | `transaction.service.ts` | ~10 |
| 13 | 4.4 — Anomalii | Z-score pe categorie | `statistics.service.ts` | ~15 |
| 14 | 4.4 — Notificări | Creare condiționată notificare | `notification.service.ts` | ~12 |
| 15 | 4.4 — Sugestie AI | Apel Gemini pentru clasificare | `category.service.ts` | ~10 |
| 16 | 4.4 — Charts SVG | Algoritm donut chart (math) | `Reports.tsx` | ~15 |
| 17 | 4.4 — Charts SVG | Algoritm line chart (path) | `Dashboard.tsx` | ~12 |
| 18 | 4.5 — Schema BD | Definiție Prisma `model Transaction` | `schema.prisma` | ~20 |

---

# DETALII PENTRU FIECARE SECVENȚĂ

## 📌 Secvența 1 — Validare variabile de mediu cu Zod

**Unde:** Capitolul 4.1 "Considerații privind implementarea", după paragraful care vorbește despre Zod.

**Ce demonstrează:** Configurarea backend-ului este validată **la pornire**, nu la prima cerere. Dacă lipsește o variabilă obligatorie (`DATABASE_URL`, `JWT_SECRET`), serverul refuză să pornească cu un mesaj clar. Asta previne bug-uri silențioase în producție.

**De ce e important didactic:** Arată că folosești **fail-fast** — o tehnică de inginerie software care înseamnă "preferă să eșuezi imediat și explicit decât să mergi mai departe cu o configurație invalidă".

**Codul (din `backend/src/config/env.ts`):**
```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

const parseResult = envSchema.safeParse(process.env);
if (!parseResult.success) {
  console.error('❌ Variabile de mediu invalide:', parseResult.error.format());
  process.exit(1);
}
export const env = parseResult.data;
```

**Comentariu suplimentar pentru lucrare:** "Schema Zod definește toate variabilele de mediu necesare aplicației, împreună cu tipurile lor (`z.string()`, `z.enum()`) și valorile implicite. La pornire, `safeParse()` validează `process.env` împotriva schemei; dacă validarea eșuează, serverul afișează exact ce variabile lipsesc sau au format incorect și se oprește cu cod de eroare 1."

---

## 📌 Secvența 2 — Hashing parolă + login (bcrypt)

**Unde:** Capitolul 4.4, sub-secțiunea **"Modulul Autentificare"**, după paragraful despre înregistrare.

**Ce demonstrează:** Parolele NU sunt niciodată stocate în clar. La login, parola primită e re-hash-uită cu același salt (extras din hash-ul stocat) și comparată. Dacă cineva ar avea acces la DB, **nu poate** recupera parolele originale.

**De ce e important:** Comisia testează des: "Cum stochezi parolele?" — răspunsul corect e "**Hashing**, nu criptare". Bcrypt e standardul industriei.

**Codul (din `backend/src/modules/auth/auth.service.ts`):**
```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

static async login(data: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new AppError('Nu există cont cu acest email.', 401, 'EMAIL_NOT_FOUND');
  }
  // bcrypt extrage salt-ul din hash-ul stocat, re-hash-uiește
  // input-ul și compară. Cost factor 10 = ~100ms per încercare,
  // ceea ce face brute-force impracticabil chiar și pe GPU.
  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) {
    throw new AppError('Parolă incorectă.', 401, 'INVALID_PASSWORD');
  }
  const accessToken = jwt.sign({ userId: user.id }, env.JWT_SECRET,
    { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user.id }, env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' });
  return { user, accessToken, refreshToken };
}
```

---

## 📌 Secvența 3 — Generare JWT dual-token

**Unde:** Imediat după secvența 2.

**Ce demonstrează:** Arhitectura cu access token scurt (15 min) + refresh token lung (7 zile). Compromisul între securitate (token compromis = max 15 min de exploatare) și ergonomie (utilizatorul nu re-loghează manual la 15 min).

**Codul (din `backend/src/modules/auth/auth.service.ts`, separat de login pentru claritate):**
```typescript
const accessToken = jwt.sign(
  { userId: user.id },
  env.JWT_SECRET,
  { expiresIn: '15m' }   // 15 minute
);

const refreshToken = jwt.sign(
  { userId: user.id },
  env.JWT_REFRESH_SECRET,  // secret DIFERIT de access
  { expiresIn: '7d' }      // 7 zile
);
```

**Comentariu suplimentar:** "Secret-urile JWT_SECRET și JWT_REFRESH_SECRET sunt **distincte**. Asta permite revocarea independentă (poți schimba JWT_REFRESH_SECRET pentru a forța re-login pe toți utilizatorii, fără a invalida access token-urile active care expiră în max 15 min)."

---

## 📌 Secvența 4 — Cookie httpOnly + refresh rotation

**Unde:** După secvența 3, în paragraful care explică cum cookie-ul protejează contra XSS.

**Ce demonstrează:** Setările exacte ale cookie-ului care îl fac inaccesibil din JavaScript (`httpOnly`), trimis doar peste HTTPS (`Secure`) și care nu se trimite la cereri cross-site neașteptate (`SameSite`).

**Codul (din `backend/src/shared/cookies.ts`):**
```typescript
import type { Response, CookieOptions } from 'express';
import { isProduction } from '../config/env.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,        // JS din browser NU poate citi cookie-ul → anti-XSS
    secure: isProduction,  // trimis doar peste HTTPS în producție
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  };
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, refreshCookieOptions());
}
```

**Comentariu suplimentar:** "În producție folosim `SameSite=None` pentru că frontend și backend sunt pe sub-domenii diferite (`*.up.railway.app`); `SameSite=Strict` ar bloca cookie-ul complet. Pentru a folosi `None`, trebuie obligatoriu `Secure=true` (regulă browser-ului)."

---

## 📌 Secvența 5 — Axios interceptor pe 401 (auto refresh)

**Unde:** Capitolul 4.4, în paragraful despre cum se gestionează expirarea access token-ului.

**Ce demonstrează:** Atunci când un access token expiră (după 15 minute), aplicația NU forțează utilizatorul să se re-logheze. În schimb, un interceptor axios prinde răspunsul 401, cere un nou access token folosind refresh cookie-ul, apoi re-trimite cererea originală — totul transparent pentru utilizator.

**Codul (din `frontend/src/services/api.ts`):**
```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/refresh']
      .some(p => originalRequest?.url?.includes(p));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true; // marcaj să nu intrăm în buclă infinită
      try {
        const res = await api.post('/auth/refresh');
        const newToken = res.data?.data?.accessToken;
        useAuthStore.getState().setAuth(currentUser, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest); // re-trimite cererea originală
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 📌 Secvența 6 — Generare token reset + hash SHA-256

**Unde:** Capitolul 4.4, sub-secțiunea **"Resetarea parolei"**, după paragraful introductiv.

**Ce demonstrează:** Token-ul de resetare e generat criptografic random (24 bytes = 192 bits, imposibil de ghicit), iar în baza de date stocăm **hash-ul** SHA-256 al token-ului, nu token-ul brut. Chiar dacă cineva fură DB-ul, nu poate genera link-uri valide.

**De ce contează:** Demonstrează că ai gândit "**defense in depth**" — straturi suplimentare de securitate dincolo de minimul necesar.

**Codul (din `backend/src/modules/auth/password-reset.service.ts`):**
```typescript
import crypto from 'crypto';

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true, token: null }; // nu leak which emails există

  const token = crypto.randomBytes(24).toString('hex'); // 48 hex chars
  const tokenHash = sha256(token);

  store.set(tokenHash, {
    userId: user.id,
    email: user.email,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 oră
  });

  const resetUrl = `${frontendBase}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Resetare parolă FARO',
    html: passwordResetEmailHtml(resetUrl, user.firstName),
  });
  return { ok: true, token: null };
}
```

**Comentariu suplimentar:** "Returnăm `ok: true` chiar dacă email-ul nu există, ca să prevenim **enumerarea de conturi** — un atacator care încearcă multiple email-uri NU poate afla care sunt înregistrate."

---

## 📌 Secvența 7 — Trimitere email cu Resend

**Unde:** După secvența 6.

**Ce demonstrează:** Integrare cu un serviciu extern (Resend) folosind SDK-ul oficial. Gestionează cazul în care cheia API lipsește (graceful fallback).

**Codul (din `backend/src/shared/email.ts`):**
```typescript
import { Resend } from 'resend';

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export async function sendEmail(params: SendEmailParams) {
  const c = getClient();
  if (!c) {
    console.warn('[email] RESEND_API_KEY missing, email NOT sent');
    return { ok: false };
  }
  const result = await c.emails.send({
    from: process.env.RESEND_FROM || 'FARO <onboarding@resend.dev>',
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
  return { ok: !result.error };
}
```

---

## 📌 Secvența 8 — Algoritm validare buget (`checkBudget`)

**Unde:** Capitolul 4.4, sub-secțiunea **"Validarea bugetelor"**, ca exemplu central al algoritmului.

**Ce demonstrează:** Înainte de a salva o tranzacție de tip cheltuială, sistemul:
1. Găsește bugetul aplicabil pentru luna și categoria respectivă;
2. Calculează suma cheltuielilor existente;
3. Adaugă noua sumă și compară cu limita;
4. Dacă depășește, returnează detalii pentru afișarea avertismentului.

**Codul (din `backend/src/modules/budget/budget-validator.ts`):**
```typescript
export async function checkBudget(
  userId: string,
  categoryId: string,
  amount: number,
  date: Date
): Promise<BudgetWarningData | null> {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // 1. Bugetul lunii pentru categoria respectivă
  const budget = await prisma.budget.findFirst({
    where: { userId, month, year, isTotal: false },
    include: { categories: { where: { categoryId } } },
  });
  if (!budget || budget.categories.length === 0) return null;

  const limitAmount = Number(budget.categories[0].limitAmount);

  // 2. Suma cheltuielilor existente în luna asta pe categoria asta
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const existing = await prisma.transaction.findMany({
    where: { userId, categoryId, type: 'expense',
             date: { gte: startOfMonth, lte: endOfMonth } },
  });
  const currentSpent = existing.reduce((s, t) => s + Number(t.amount), 0);
  const newTotal = currentSpent + Number(amount);

  // 3. Verifică depășirea
  if (newTotal > limitAmount) {
    return { categoryId, currentSpent, budgetLimit: limitAmount,
             newTotal, overage: newTotal - limitAmount };
  }
  return null;
}
```

---

## 📌 Secvența 9 — Prompt structurat pentru Gemini (OCR)

**Unde:** Capitolul 4.4, sub-secțiunea **"Scanarea bonurilor"**, înainte de codul propriu-zis de apel.

**Ce demonstrează:** Cum se "programează" un model AI prin **prompt engineering** — instrucțiuni clare, schemă JSON explicită, exemple, reguli pentru cazuri ambigue.

**Codul (din `backend/src/modules/transaction/receipt-scanner.service.ts`):**
```typescript
const PROMPT = `Ești un asistent OCR care transformă bonuri fiscale
românești în date structurate (ca un bon digital Lidl Plus).

Analizează imaginea atașată și extrage:
1. Antet: numele magazinului ("merchant"), adresa ("address" — opțional).
2. Data și ora: "date" în format YYYY-MM-DD, "time" în format HH:MM 24h.
3. Fiecare produs din listă ca element în "items":
   - "name": denumirea așa cum apare pe bon
   - "qty": cantitatea (1 dacă nu e specificat)
   - "unitPrice": prețul unitar dacă apare explicit (poate fi null)
   - "total": prețul total al liniei (cantitate × unit)
4. Totaluri: "subtotal", "vat" (TVA), "total" (suma finală de plată).
5. "paymentMethod": "card" / "numerar" / "altul".

Răspunde STRICT cu JSON valid, fără markdown fences.`;
```

**Comentariu suplimentar:** "Prompt-ul e formulat în limba română pentru că bonurile sunt românești; modelul răspunde mai bine pentru fenomenele lingvistice locale (diacritice, abrevieri 'TOTAL DE PLATĂ') când contextul e tot în română."

---

## 📌 Secvența 10 — Apel multimodal Gemini + parsare JSON

**Unde:** Imediat după secvența 9.

**Ce demonstrează:** Cum se trimite o imagine (ca base64 inline) împreună cu textul către Gemini, și cum se forțează output-ul în JSON valid.

**Codul (din `backend/src/modules/transaction/receipt-scanner.service.ts`):**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function scanReceiptWithGemini(
  imageBase64: string,
  mimeType: string,
): Promise<ScannedReceipt> {
  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json', // forțează JSON valid
    },
  });

  const result = await model.generateContent([
    { text: PROMPT },
    { inlineData: { mimeType, data: imageBase64 } }, // imaginea inline
  ]);

  const raw = result.response.text().trim();
  const parsed = JSON.parse(raw);
  return normalizeReceiptData(parsed);
}
```

---

## 📌 Secvența 11 — Algoritm `generateInstances` pentru recurring

**Unde:** Capitolul 4.4, sub-secțiunea **"Generarea tranzacțiilor recurente"**.

**Ce demonstrează:** Cum se generează un array de instanțe ale aceleași tranzacții la intervale regulate. JS gestionează corect lunile cu zile diferite (31 ian + 1 lună = 3 martie, nu 31 februarie inexistent).

**Codul (din `backend/src/modules/transaction/recurring-transaction-engine.ts`):**
```typescript
import { v4 as uuidv4 } from 'uuid';

static generateInstances(params: GenerateInstancesParams): RecurringTransactionInstance[] {
  const recurringGroupId = uuidv4(); // partajat între toate instanțele
  const instances: RecurringTransactionInstance[] = [];

  for (let i = 0; i < params.repetitionCount; i++) {
    const date = this.calculateDate(params.startDate, params.frequency, i);
    instances.push({
      ...params,
      date,
      isRecurring: true,
      recurringGroupId,
      originalStartDate: params.startDate,
      sequenceNumber: i + 1,
    });
  }
  return instances;
}

private static calculateDate(startDate: Date, freq: RecurringFrequency, n: number) {
  const d = new Date(startDate);
  switch (freq) {
    case 'daily':   d.setDate(d.getDate() + n); break;
    case 'weekly':  d.setDate(d.getDate() + n * 7); break;
    case 'monthly': d.setMonth(d.getMonth() + n); break;
    case 'yearly':  d.setFullYear(d.getFullYear() + n); break;
  }
  return d;
}
```

---

## 📌 Secvența 12 — Salvare atomică cu `prisma.$transaction`

**Unde:** După secvența 11.

**Ce demonstrează:** Toate instanțele se salvează într-o **singură tranzacție DB** — ori toate reușesc, ori niciuna. Asta garantează că NU ajungi cu 5 din 12 instanțe salvate dacă crapă serverul la mijloc.

**Codul (din `backend/src/modules/transaction/transaction.service.ts`):**
```typescript
static async createRecurringTransactions(userId: string, instances) {
  // prisma.$transaction = ACID guarantee
  return await prisma.$transaction(async (tx) => {
    const created = [];
    for (const instance of instances) {
      const transaction = await tx.transaction.create({
        data: { ...instance, userId },
        include: { category: true },
      });
      created.push(transaction);
    }
    return created;
  });
}
```

**Comentariu suplimentar:** "Dacă oricare INSERT eșuează (de exemplu, FK constraint violation), Prisma face automat ROLLBACK — niciuna din inserțiile anterioare nu rămâne în DB. Asta e proprietatea de **Atomicitate** din ACID."

---

## 📌 Secvența 13 — Detectarea anomaliilor cu z-score

**Unde:** Capitolul 4.4, sub-secțiunea **"Detectarea anomaliilor"**.

**Ce demonstrează:** Implementarea unui algoritm statistic clasic (z-score) pentru a marca automat tranzacțiile neobișnuit de mari sau mici față de istoricul categoriei.

**Codul (versiunea simplificată din `backend/src/modules/statistics/statistics.service.ts`):**
```typescript
// Pentru fiecare categorie, calculează media și deviația standard
// pe baza istoricului ultimelor 90 zile (excluzând luna curentă)
const stats = new Map<string, { mean: number; std: number }>();
for (const [catId, amounts] of byCategory) {
  if (amounts.length < 3) continue; // nu avem suficiente date

  const mean = amounts.reduce((s, x) => s + x, 0) / amounts.length;
  const variance = amounts.reduce((s, x) => s + (x - mean) ** 2, 0)
                   / amounts.length;
  stats.set(catId, { mean, std: Math.sqrt(variance) });
}

// Marcează ca anormale tranzacțiile cu |z-score| >= 2
const anomalies = recentTransactions.filter(t => {
  const s = stats.get(t.categoryId);
  if (!s || s.std === 0) return false;
  const zScore = (Number(t.amount) - s.mean) / s.std;
  return Math.abs(zScore) >= 2;
});
```

**Comentariu suplimentar:** "Pragul |z| >= 2 corespunde aproximativ la top 5% absolut al unei distribuții normale. Pentru cheltuielile zilnice care urmează aproximativ o distribuție normală, asta înseamnă că marcăm doar tranzacțiile cu adevărat ieșite din comun."

---

## 📌 Secvența 14 — Creare notificare de buget

**Unde:** Capitolul 4.4, sub-secțiunea despre **notificări**.

**Ce demonstrează:** Cum se respectă preferința utilizatorului (toggle "Notificări buget" din Setări) înainte de a crea notificarea, și cum se evită spam-ul (deduplicare pentru `budget_near_limit`).

**Codul (din `backend/src/modules/notification/notification.service.ts`):**
```typescript
static async checkAndCreateBudgetNotifications(
  userId: string, categoryId: string, transactionDate: Date,
) {
  // 1. Respectă preferința utilizatorului
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { budgetNotifications: true },
  });
  if (!user || user.budgetNotifications === false) return;

  // 2. Calculează ce procent din buget e folosit
  const percentage = (totalSpent / limitAmount) * 100;

  // 3. Creează notificare cu mesaj adecvat severității
  if (percentage >= 100) {
    // Fiecare overage → notificare nouă (utilizatorul vrea avertizare repetată)
    await prisma.notification.create({
      data: {
        userId, type: 'budget_exceeded',
        title: 'Limită buget depășită',
        message: `Ai depășit limita pentru "${category.name}". ` +
                 `Cheltuit: ${totalSpent.toFixed(2)} RON / Limită: ` +
                 `${limitAmount.toFixed(2)} RON`,
        relatedEntityId: budgetCategory.id,
      },
    });
  }
}
```

---

## 📌 Secvența 15 — Sugestie automată de categorie

**Unde:** Capitolul 4.4, sub-secțiunea **"Sugestia automată de categorie"**.

**Ce demonstrează:** Apel către Gemini cu un prompt simplu care primește descrierea tranzacției + lista de categorii și returnează categoria potrivită. Folosit la introducerea manuală a unei tranzacții (auto-completare) și la procesarea bonurilor OCR.

**Codul (versiunea simplificată din `backend/src/modules/category/category.service.ts`):**
```typescript
static async suggest(description: string, type: 'income' | 'expense',
                     userCategories: Category[]): Promise<{ categoryId: string } | null> {
  const categoryList = userCategories
    .filter(c => c.type === type)
    .map(c => `- ${c.name} (id: ${c.id})`)
    .join('\n');

  const prompt = `Pentru tranzacția cu descrierea "${description}",
alege CEA MAI POTRIVITĂ categorie din lista de mai jos.
Răspunde DOAR cu ID-ul categoriei alese, nimic altceva.

Categorii disponibile:
${categoryList}`;

  const result = await model.generateContent(prompt);
  const categoryId = result.response.text().trim();
  return userCategories.find(c => c.id === categoryId)
    ? { categoryId } : null;
}
```

---

## 📌 Secvența 16 — Donut chart matematic în SVG

**Unde:** Capitolul 4.4, sub-secțiunea **"Grafice (SVG inline)"** (poate fi adăugată la 4.4).

**Ce demonstrează:** Geometria unui chart donut implementat manual cu SVG (fără bibliotecă). Folosește `stroke-dasharray` pe `<circle>` pentru a desena fiecare felie ca un arc.

**Formula matematică:**
- Pentru o felie cu procentajul `share` din total: arc length = `share × C` (unde C = circumferința = `2π·r`)
- `stroke-dasharray = "<arc> <C - arc>"` lasă vizibil doar arcul corespunzător
- `stroke-dashoffset` rotește începutul fiecărei felii cu offset-ul acumulat

**Codul (din `frontend/src/features/reports/Reports.tsx`):**
```typescript
const STROKE = 22;
const SIZE = 220;
const RADIUS = SIZE / 2 - STROKE / 2 - 4;
const C = 2 * Math.PI * RADIUS;
const GAP = rows.length > 1 ? 0.012 * C : 0; // gap mic între felii

let offset = 0;
const segments = rows.map((d, i) => {
  const share = d.subtotal / total;
  const arc = Math.max(0, share * C - GAP);
  const seg = { ...d, idx: i, share, arc, dashOffset: -offset };
  offset += share * C;
  return seg;
});

// Apoi în JSX: <circle stroke-dasharray={`${arc} ${C - arc}`} stroke-dashoffset={dashOffset} />
```

---

## 📌 Secvența 17 — Line chart matematic în SVG

**Unde:** După secvența 16.

**Ce demonstrează:** Cum se construiește un path SVG pentru un grafic linear, calculând coordonatele x,y pentru fiecare punct din date.

**Formula:**
- `xStep = (W - padL - padR) / (n - 1)` — distanța orizontală între puncte
- `y(v) = padT + (1 - (v - min) / (max - min)) × (H - padT - padB)` — coordonata Y inversată (în SVG, Y crește în jos)
- Path-ul: `M x0 y0 L x1 y1 L x2 y2 ...`

**Codul (din `frontend/src/features/dashboard/Dashboard.tsx`):**
```typescript
function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  const W = 720, H = 240;
  const padL = 44, padR = 12, padT = 12, padB = 28;

  const max = Math.max(1000, Math.ceil(Math.max(...allValues) / 1000) * 1000);
  const min = Math.min(0, Math.floor(Math.min(...allValues) / 1000) * 1000);

  const xStep = (W - padL - padR) / (data.length - 1);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);

  const lineFor = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * xStep} ${y(v)}`)
       .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <path d={lineFor(incomeData)} stroke="#0ab39c" fill="none" strokeWidth="2" />
      <path d={lineFor(expenseData)} stroke="#f5556e" fill="none" strokeWidth="2" />
    </svg>
  );
}
```

---

## 📌 Secvența 18 — Schema Prisma `model Transaction`

**Unde:** Capitolul 4.5 "Structura bazei de date", la **sub-secțiunea Transaction**.

**Ce demonstrează:** Limbajul declarativ Prisma. Un singur fișier descrie toate câmpurile, tipurile, constrângerile și relațiile. Din acest fișier se generează automat schema SQL pentru PostgreSQL și clientul TypeScript type-safe.

**Codul (din `backend/prisma/schema.prisma`):**
```prisma
model Transaction {
  id                String   @id @default(uuid())
  amount            Float
  type              String   // "income" | "expense"
  description       String?
  date              DateTime
  categoryId        String
  userId            String
  receiptUrl        String?
  receiptData       Json?    // bonul digital (JSONB)
  isRecurring       Boolean  @default(false)

  // Câmpuri pentru tranzacții recurente
  recurringGroupId  String?  // UUID partajat de toate instanțele
  frequency         String?  // "daily" | "weekly" | "monthly" | "yearly"
  originalStartDate DateTime?
  sequenceNumber    Int?     // poziția în serie (1, 2, 3, ...)

  createdAt         DateTime @default(now())

  category Category @relation(fields: [categoryId], references: [id])
  user     User     @relation(fields: [userId], references: [id])

  @@index([userId, date])              // pentru filtrare pe perioadă
  @@index([userId, recurringGroupId])  // pentru ștergerea unei serii
}
```

**Comentariu suplimentar:** "Indexurile compuse `@@index([userId, date])` și `@@index([userId, recurringGroupId])` sunt esențiale pentru performanță. Primul accelerează query-ul de listare tranzacții pe luna curentă (cel mai frecvent), al doilea accelerează ștergerea în masă a unei serii recurente."

---

# 🎯 Cum sunt formatate snippet-urile în .docx

În `LICENTA.docx` regenerat, fiecare secvență de cod:

- **Font:** Courier New 10pt (mono-spațiat, ca în orice editor de cod)
- **Indentat** la stânga cu ~1 cm pentru distincție vizuală
- **Bordură subțire** gri sus și jos pentru a delimita clar începutul și sfârșitul
- **Line spacing 1.2** (mai dens decât textul normal, ca să încapă mai mult cod)
- **Comentariile** în cod folosesc `//` pentru TypeScript/JavaScript și `--` pentru SQL, conform standardelor

Pentru a face un snippet și mai vizibil în Word după inserare, poți:
1. Aplica un fundal gri deschis (Format → Borders and Shading → Fill #F5F5F5)
2. Sau folosi un "Quote" style customizat
3. Sau adăuga un caption "**Listing 1**: Validare env cu Zod" deasupra fiecărui snippet

---

# 📌 Recomandare finală

**Dacă comisia te întreabă** "Arată-mi un fragment de cod și explică-mi ce face":
- Cele mai impresionante sunt: **Secvența 8 (budget)**, **Secvența 11 (recurring)**, **Secvența 13 (z-score)**, **Secvența 16 (donut math)**
- Toate astea conțin **logică de business reală** + matematică/algoritmică, nu doar configurare

**Dacă comisia te întreabă** "Cum protejezi datele utilizatorilor":
- Arată: **Secvența 2 (bcrypt)**, **Secvența 4 (cookie httpOnly)**, **Secvența 6 (hash token)**

**Dacă comisia te întreabă** "Cum interacționezi cu AI-ul":
- Arată: **Secvența 9 (prompt)**, **Secvența 10 (multimodal API)**, **Secvența 15 (clasificare)**

Documentul `LICENTA.docx` din momentul commit-ului ce însoțește acest ghid conține toate cele 18 secvențe integrate la locurile potrivite.
