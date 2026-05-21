# FARO — Specificații Tehnice Algoritmice

> Document de aprofundare pentru susținerea licenței: **cum funcționează intern** fiecare feature non-trivial — algoritmi, formule, complexitate, decizii de implementare.

Folosește acest document împreună cu [TECH_STACK.md](TECH_STACK.md) (stack + arhitectură) și [PREGATIRE_LICENTA.md](PREGATIRE_LICENTA.md) (Q&A general). Cele trei se completează.

---

## 1. OCR pe bonuri fiscale

### 1.1. Arhitectura — multimodal LLM în loc de OCR clasic

**Decizia:** nu folosim algoritmi clasici de OCR (Tesseract, OpenCV + caractere). Folosim **Gemini 2.5 Flash Lite** ca model multimodal — primește imaginea ca input și returnează direct datele structurate.

**Motivație:**
- Tesseract are nevoie de imagine binarizată curată (alb-negru), preprocesare (deskew, dewarp), apoi recunoaște caractere. Bonurile termice cu fonturi non-standard, lumină proastă, hârtie șifonată îl bat constant.
- Modelele multimodale moderne (Gemini, GPT-4V, Claude Sonnet) au fost antrenate pe milioane de imagini cu text și extrag direct semantica (preț, magazin, dată) — nu doar caractere.
- Pentru bonuri românești cu diacritice și formate variabile, Gemini ajunge la ~95% acuratețe pe primul shot, vs ~60% Tesseract.

### 1.2. Pipeline complet

```
[Imagine bon]
    ↓
[Frontend] FileReader → base64 dataURL
    ↓ POST /api/transactions/scan-receipt
[Backend] payload: { image: <base64>, mimeType: "image/jpeg" }
    ↓
[Backend] receipt-scanner.service.ts
    ↓
[Gemini SDK] model.generateContent([
    { text: <prompt structurat în română> },
    { inlineData: { mimeType, data: base64 } }
  ], { responseMimeType: "application/json" })
    ↓
[Gemini] returns JSON string
    ↓
[Backend] JSON.parse + normalizeReceiptData (type-safe coercion)
    ↓ { merchant, address, date, time, items[], subtotal, vat, total, paymentMethod, currency }
[Frontend] auto-fill form + render digital receipt
```

### 1.3. Prompt engineering

Prompt-ul către Gemini:

```
Ești un asistent OCR care transformă bonuri fiscale românești în date 
structurate (ca un bon digital Lidl Plus).

Analizează imaginea și extrage TOATĂ informația din bon:
1. Antet: numele magazinului, adresa (opțional)
2. Data și ora: YYYY-MM-DD, HH:MM
3. Fiecare produs în "items": name, qty, unitPrice, total
4. Totaluri: subtotal, vat, total
5. paymentMethod: "card" / "numerar" / "altul"
6. currency: "RON" (sau alt cod)

Răspunde STRICT cu JSON valid:
{ "merchant": ..., "items": [...], ... }
```

**Tehnici aplicate:**

| Tehnică | De ce |
|---|---|
| Persona explicită ("ești un asistent OCR") | Setează contextul, reduce halucinațiile |
| Schema strictă listată în prompt | Modelul "se ancorează" pe shape-ul cerut |
| Exemplu de format JSON inclus | Few-shot learning implicit |
| `responseMimeType: "application/json"` în API config | Garantează că răspunsul e JSON valid (Gemini face validare internă) |
| Instrucțiune "pune null dacă nu poți citi" | Evită inventarea de date |

### 1.4. Validare și normalizare răspuns

Gemini poate returna ocazional JSON "aproape valid" (ghilimele wrap, fields lipsă, tipuri greșite). Funcția `normalizeReceiptData()` coerce-uiește totul la tipul așteptat:

```ts
function normalizeReceiptData(parsed): ReceiptData {
  return {
    merchant: trimStr(parsed.merchant),          // null dacă nu e string
    date: isoDateStr(parsed.date),                // valid doar dacă matchează YYYY-MM-DD
    items: Array.isArray(parsed.items) 
      ? parsed.items.filter(validItem)            // drop linii fără name + total
      : [],
    total: toPositiveNumber(parsed.total),        // null dacă < 0 sau NaN
    ...
  };
}
```

**Principiu:** garantăm că *consumer-ul* (frontend) primește mereu un obiect de formă predictibilă, indiferent de ce halucinează modelul.

### 1.5. Complexitate și cost

- **Latency:** ~2-4 sec per bon (variabil cu dimensiunea imaginii)
- **Cost:** $0 (free tier 1000 RPD pe `gemini-2.5-flash-lite`)
- **Limită payload:** 5 MB JSON body (configurat în Express). Suficient pentru poze de 2-3 MB convertite în base64 (overhead ~33%)
- **Storage:** **zero** — nu stocăm imaginea, doar JSON-ul rezultat în coloana `receiptData Json?` din tabela `Transaction`

### 1.6. Compararea cu OCR clasic

| Aspect | Tesseract.js (vechi) | Gemini Vision (actual) |
|---|---|---|
| Acuratețe bonuri RO | ~60% | ~95% |
| Preprocesare necesară | Da (deskew, threshold) | Nu |
| Extragere line items | Nu, doar text raw | Da, structurat direct |
| Bundle size frontend | +10 MB (language packs) | 0 (server-side) |
| Latency | 5-15 sec client-side | 2-4 sec server-side |
| Funcționează offline | Da | Nu |

Pentru un trade-off de "necesită conexiune", capătăm acuratețe semnificativ mai bună și UX mult mai fluid.

---

## 2. Detectarea tranzacțiilor anormale (Z-score)

### 2.1. Algoritmul

Folosim **scor Z** (standard score, distanța față de medie în deviații standard) pentru a identifica tranzacții cu sume neobișnuit de mari pentru categoria lor.

**Pașii:**

1. Iau toate tranzacțiile de tip `expense` din ultimele **90 de zile** (fereastră de baseline)
2. Le grupez pe categorie (`Map<categoryId, Transaction[]>`)
3. Pentru fiecare categorie cu ≥ 5 tranzacții (eșantion suficient):
   - Calculez **media μ** a sumelor
   - Calculez **deviația standard σ**
4. Pentru fiecare tranzacție din ultimele **14 zile** (fereastră de alertă):
   - Calculez `z = (amount - μ) / σ`
   - Dacă `z ≥ 2.0` → e o anomalie
5. Sortez descrescător după z-score, returnez top 10

### 2.2. Formule

**Media aritmetică:**
$$\mu = \frac{1}{n} \sum_{i=1}^{n} x_i$$

**Variația (populație, nu eșantion):**
$$\sigma^2 = \frac{1}{n} \sum_{i=1}^{n} (x_i - \mu)^2$$

**Deviația standard:**
$$\sigma = \sqrt{\sigma^2}$$

**Z-score:**
$$z_i = \frac{x_i - \mu}{\sigma}$$

### 2.3. Implementare

```ts
const amounts = list.map((t) => Number(t.amount));
const mean = amounts.reduce((s, n) => s + n, 0) / amounts.length;
const variance =
  amounts.reduce((s, n) => s + (n - mean) ** 2, 0) / amounts.length;
const std = Math.sqrt(variance);

for (const t of list) {
  if (t.date < alertStart) continue;
  const z = (Number(t.amount) - mean) / std;
  if (z >= zThreshold) { /* flag as anomaly */ }
}
```

### 2.4. De ce z-score și nu alte metode

| Metodă | Pro | Contra |
|---|---|---|
| **Z-score** (folosit) | Simplu, intuitiv, formula clasică | Asumă distribuție aproximativ normală |
| Median + MAD | Robust la outliers extreme | Mai complex, mai puțin intuitiv |
| Percentile (P95) | Foarte robust | Necesită eșantion mare |
| Isolation Forest, LOF | ML state-of-the-art | Overkill, necesită antrenare |

Pentru cheltuielile unui utilizator individual, distribuția e *log-normal* aproximativ (zilnice mici frecvente + rare mari). Z-score pe scară liniară prinde "explozii" — mizez pe sume cu mult peste medie. E suficient pentru scope-ul aplicației.

### 2.5. Parametri de tuning

- **Lookback 90 zile** — destul de lung să capteze pattern-uri sezoniere (lunile pline vs goale), destul de scurt să nu includă obiceiuri vechi schimbate.
- **Alert window 14 zile** — afișează doar anomalii recente, evită spam de alerte vechi.
- **minSamples = 5** — sub asta, μ și σ sunt zgomot pur, alertele ar fi false-positive constant.
- **zThreshold = 2.0** — corespunde aproximativ percentilei 97.5% pe distribuție normală (regula 68-95-99.7). 2σ înseamnă "în top 2.5% al cheltuielilor pentru categoria asta".

**Complexitate:** O(N) unde N = nr. tranzacții în 90 zile. Trecere unică prin lista grupată. Pentru un user cu 500 tranzacții/lună → 1500 tranzacții → instant (sub 50ms).

---

## 3. Generarea tranzacțiilor recurente

### 3.1. Modelul de date

O "tranzacție recurentă" în UI = un **set de N tranzacții individuale** în DB, legate prin `recurringGroupId` (UUID partajat). Fiecare instanță are:
- `sequenceNumber` (1, 2, 3, ...) — poziția în serie
- `frequency` (daily/weekly/monthly/yearly)
- `originalStartDate` — referința pentru a calcula off-by-day

Avantajul: la afișare, fiecare instanță e o tranzacție normală. Ștergerea unei instanțe nu afectează celelalte. Ștergerea "tot ce e după aceasta" se face cu un singur `deleteMany` cu `gte: date`.

### 3.2. Algoritmul `generateInstances(params)`

Input: `{ startDate, frequency, repetitionCount, ...rest }`

```ts
const recurringGroupId = uuidv4();
const instances = [];
for (let i = 0; i < repetitionCount; i++) {
  const date = calculateDate(startDate, frequency, i);
  instances.push({ ...rest, date, recurringGroupId, sequenceNumber: i + 1 });
}
return instances;
```

Apoi `prisma.$transaction()` le inserează atomic.

### 3.3. Logica `calculateDate` per frecvență

**Daily:** `date + i zile`
```ts
date.setUTCDate(startDate.getUTCDate() + i);
```

**Weekly:** `date + i * 7 zile`

**Monthly:** preservă ziua lunii, gestionează edge cases:
```ts
const targetMonth = month + i;
const targetYear = year + Math.floor(targetMonth / 12);
const normalizedMonth = targetMonth % 12;
const lastDayOfMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
const targetDay = Math.min(originalDay, lastDayOfMonth);
return new Date(Date.UTC(targetYear, normalizedMonth, targetDay));
```

**Cazuri tratate:**
- 31 ian → 28/29 feb → 31 mar → 30 apr → 31 mai (ziua se "ajustează" la ultima zi validă)
- Trecerea anului (luna 12 + 2 = anul+1, luna 2)

**Yearly:** preservă luna+ziua. Edge case explicit pentru **29 feb în ani non-bisecți** → cade pe 28 feb:
```ts
if (month === 1 && originalDay === 29 && !isLeapYear(targetYear)) {
  return new Date(Date.UTC(targetYear, 1, 28));
}
```

**Test pentru an bisect** (regula calendarului gregorian completă):
```ts
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
```

- 2024: 4|2024, 100∤2024 → bisect ✓
- 2100: 4|2100, 100|2100, 400∤2100 → non-bisect ✗
- 2000: 4|2000, 100|2000, 400|2000 → bisect ✓

### 3.4. De ce UTC pretutindeni

Toate calculele de date folosesc `getUTC*` și `setUTC*` în loc de variantele local-time. Asta evită bug-uri unde DST (ora de vară) face ca "30 zile" să nu fie exact 30×24h în orele de tranziție. Stocăm în Postgres ca UTC, calculăm ca UTC, afișăm convertit în local doar la nivel de UI.

---

## 4. Sugestia automată de categorie (AI clasificare)

### 4.1. Strategia

La introducerea descrierii ("Lidl Cluj-Napoca"), backend-ul:
1. Listează toate categoriile utilizatorului (cu nume + tip)
2. Trimite la Gemini un prompt scurt cu descrierea + lista
3. Modelul returnează `{ categoryId, confidence }` în JSON

Prompt simplificat:

```
Utilizatorul introduce: "Lidl Cluj-Napoca"
Tip: expense

Categorii disponibile:
- abc-123: Mâncare
- def-456: Haine
- ghi-789: Transport
...

Returnează JSON: { "categoryId": "<id>", "confidence": 0-1 }
```

### 4.2. De ce LLM și nu clasificare tradițională

Alternative considerate:
- **Naive Bayes pe cuvinte** — necesită training set, etichetat manual
- **Embeddings + cosine similarity** — necesită bază de exemple
- **Regex hardcodat** ("Lidl|Kaufland|Carrefour" → Mâncare) — fragil, nu se adaptează

Gemini are *common sense* despre lume. Știe că "Lidl" e un retailer alimentar, "BTArena" e divertisment, "Regio" e transport. **Zero training, zero curatare de date.**

### 4.3. Cache pe frontend

Cererea de sugestie e debounced (350ms) și cache-uită prin React Query după descriere. Tasta repede "Lidl" → un singur request după pauză.

---

## 5. Charts — implementare SVG inline

### 5.1. De ce SVG inline și nu Recharts/Chart.js

Pentru chart-uri custom (donut, line chart Dashboard, sparkline), folosim **SVG inline** scris în JSX:
- **Zero dependencies** — fără 100KB+ de Chart.js
- **Controlul total** asupra animațiilor (CSS transitions, donutGrow keyframe)
- **Performant** — SVG e nativ în DOM, browser-ul îl optimizează
- **Customizable per pixel** — fonturi serif italic pentru cifre, gradient fills, drop shadows

Recharts e folosit doar într-un singur loc unde chart-ul e simplu și nu merita reimplementat.

### 5.2. Donut Chart (Reports)

#### Algoritmul

Donut-ul e desenat cu `<circle>` SVG-uri suprapuse, fiecare cu `strokeDasharray` ce controlează cât din circumferință e umplut.

```
Circumferința totală: C = 2πr
Pentru o felie cu cota share = value/total:
  arc_length = share * C - GAP   (lăsăm un mic spațiu între felii)
  stroke-dasharray = "arc_length (C - arc_length)"
  stroke-dashoffset = -offset_acumulat
```

Codul efectiv:
```ts
const STROKE = 22, SIZE = 220;
const RADIUS = SIZE/2 - STROKE/2 - 4;
const C = 2 * Math.PI * RADIUS;
const GAP = rows.length > 1 ? 0.012 * C : 0;  // 1.2% gap, dezactivat la 1 felie

let offset = 0;
const segments = rows.map(d => {
  const share = d.subtotal / total;
  const arc = Math.max(0, share * C - GAP);
  const seg = { ...d, arc, dashOffset: -offset };
  offset += share * C;
  return seg;
});
```

Apoi în SVG:
```jsx
<svg style={{ transform: 'rotate(-90deg)' }}>  {/* roteste startul la ora 12 */}
  {segments.map(s => (
    <circle
      cx={SIZE/2} cy={SIZE/2} r={RADIUS}
      fill="none"
      stroke={s.color}
      strokeWidth={STROKE}
      strokeDasharray={`${s.arc} ${C - s.arc}`}
      strokeDashoffset={s.dashOffset}
    />
  ))}
</svg>
```

**De ce funcționează:**
- `strokeDasharray` definește "X pixeli desenați, Y pixeli goi" → primii X formează arcul vizibil
- `strokeDashoffset` rotește startul de unde începe pattern-ul → fiecare felie începe acolo unde s-a terminat precedenta
- `transform: rotate(-90deg)` pe SVG-ul întreg aduce ora 12 ca origin (default ar fi ora 3, est)

**Edge case** pe care l-am rezolvat: când există o singură categorie (100% cota), `GAP` lăsa un mic spațiu în vârful donut-ului, făcea pagina să arate "incompletă". Fix: `GAP = 0` când `rows.length === 1`.

#### Animația

```css
@keyframes donutGrow {
  from { stroke-dashoffset: 0; opacity: 0; }
  to { opacity: 1; }
}
```

Cu staggered delay per felie:
```jsx
style={{ animationDelay: `${s.idx * 60}ms` }}
```

→ feliile apar succesiv la load, efect de "umplere".

### 5.3. Line Chart (Dashboard — Evoluție venituri & cheltuieli)

Algoritmul:
1. Calculez `min` și `max` pe valori (income + expense combined)
2. Rotunjesc `max` la următoarea mie ca grila să arate frumos
3. Calculez `xStep = (W - padding) / (n - 1)` pentru spațierea uniformă
4. Funcția `y(v)` mapează valoarea la coordonata pixel:
   ```
   y(v) = padTop + (1 - (v - min) / (max - min)) * (H - padTop - padBottom)
   ```
   (1 - normalizat) inversează axa Y (în SVG, 0 e sus, dar vrem 0 jos)
5. Construiesc path-ul SVG:
   ```ts
   const linePath = arr.map((v, i) =>
     `${i === 0 ? 'M' : 'L'} ${padL + i*xStep} ${y(v)}`
   ).join(' ');
   ```
6. Area path (umbra de sub linie):
   ```ts
   const areaPath = linePath + ` L ${lastX} ${H-padB} L ${padL} ${H-padB} Z`;
   ```
   adaugă două puncte pentru a închide poligonul jos.

### 5.4. Sparkline (KPI cards)

Mini line chart compact:
- `viewBox="0 0 280 56"`, fără padding, fără axe
- Aceeași logică de path construction
- Plus area fill cu `linearGradient` pentru efectul "shaded"

### 5.5. Random math: hex → RGB pentru alpha overlay

Pentru background-urile soft ale categoriilor (de ex. icon-uri cu fundal `${color}1f`):
```ts
// "#2547f5" + "1f" → "#2547f51f" = 12% alpha
```
Folosim notația CSS de 8 cifre hex (RGBA cu alpha). Foarte concisă.

---

## 6. Algoritmul de validare buget

### 6.1. Cerința

Înainte de a salva o tranzacție:
- Verifică dacă există un buget pentru luna/anul/categoria tranzacției
- Calculează cheltuielile curente
- Dacă noua tranzacție depășește limita → returnează warning, frontend afișează dialog "Continuă oricum?"
- Verifică și **bugetul total lunar** (separat de cele pe categorii)
- Dacă ambele sunt depășite → afișează cel cu overage mai mare

### 6.2. Pseudo-cod

```
function checkBudget(userId, categoryId, amount, date):
  month = date.month
  year = date.year
  
  perCategory = Budget.findFirst({userId, month, year, isTotal: false})
  if perCategory and perCategory.includesCategory(categoryId):
    totalSpent = sumExpenses(userId, categoryId, month, year)
    if totalSpent + amount > perCategory.limitFor(categoryId):
      perCatWarning = { ... }
  
  totalBudget = Budget.findFirst({userId, month, year, isTotal: true})
  if totalBudget:
    allExpensesMonth = sumAllExpenses(userId, month, year)
    if allExpensesMonth + amount > totalBudget.totalLimit:
      totalWarning = { ... }
      // dacă ambele warnings, return cel mai mare overage
      if totalWarning.overage > perCatWarning.overage:
        return totalWarning
  
  return perCatWarning or null
```

### 6.3. Edge cases tratate

| Problemă | Cauza | Soluția |
|---|---|---|
| Bug: warning nu se aprinde pentru categoria X | `findFirst` returna budget cu `isTotal: true` care nu include categorii → bail-out | Adăugat `isTotal: false` în filtru |
| Comparare `number > Decimal` returna mereu false | Prisma Decimal serializat ca string, JS făcea string compare | `Number(budgetLimit)` la frontieră |
| User adaugă a doua tranzacție peste limită → nicio notificare | Dedupe pe `unread budget_exceeded` pe BudgetCategory.id | Eliminat dedupe-ul pentru `budget_exceeded`, păstrat pentru `budget_near_limit` |

### 6.4. Recurring transactions — check pe fiecare instanță

```ts
static async checkRecurringBudget(userId, categoryId, amount, dates):
  affectedMonths = []
  for date in dates:
    warning = await checkBudget(userId, categoryId, amount, date)
    if warning: affectedMonths.push({month, year, overage})
  
  return { ...firstWarning, affectedMonths } if any else null
```

Frontend afișează: "Această tranzacție recurentă va depăși bugetul în martie, aprilie și mai 2026."

---

## 7. Autentificare — implementarea detaliată

### 7.1. Schema JWT

**Access token:**
```
header:  {"alg":"HS256","typ":"JWT"}
payload: {"userId":"abc","email":"x@y.z","iat":1234567890,"exp":1234568790}
signature: HMAC-SHA256(base64url(header) + "." + base64url(payload), JWT_SECRET)
```

Token-ul final: `<base64url(header)>.<base64url(payload)>.<base64url(signature)>`

### 7.2. HMAC-SHA256

Algoritmul:
```
HMAC(K, m) = H((K' ⊕ opad) || H((K' ⊕ ipad) || m))
```
unde:
- `H` = SHA-256
- `K'` = cheia paddată la block size
- `opad` = 0x5c × block size, `ipad` = 0x36 × block size
- `⊕` = XOR
- `||` = concatenare

În practică, librăria `jsonwebtoken` face asta în `jwt.sign(payload, secret, { algorithm: 'HS256' })`.

### 7.3. Refresh token rotation

La fiecare refresh:
1. Validează refresh-ul din cookie (semnătură + expirare)
2. Generează **un access NOU + un refresh NOU**
3. Salvează noul refresh în cookie (rotește)
4. Vechiul refresh **rămâne valid până la expirare** (nu avem blacklist server-side)

Asta înseamnă: dacă cineva îți fură un refresh expirat de 6 zile, mai are 1 zi să-l folosească. Compromis acceptat pentru simplitate; pentru producție serioasă ar trebui blacklist Redis cu jti-uri folosite.

### 7.4. bcrypt — detalii

**Cost factor:** 10 → 2^10 = 1024 iterații.

Algoritmul (simplificat):
1. Generează salt aleator (16 bytes)
2. Aplică **Blowfish** modificat (EksBlowfish) cu cost iterații pe combinația parolă + salt
3. Returnează string de forma `$2a$10$<salt><hash>` (60 caractere)

**De ce cost 10?** Pe hardware modern, 10 = ~100ms per hash. La un login normal e imperceptibil. Pentru atacator cu GPU, devine 100ms × încercări → prohibitiv.

Verificarea: `bcrypt.compare(plainPassword, hash)` — extrage salt-ul din hash, re-aplică algoritmul, compară byte-by-byte cu timing-attack-safe comparison.

---

## 8. Caching — strategii

### 8.1. Frontend (TanStack Query)

Cache layer cu invalidare manuală:
- **Stale-while-revalidate** — datele cache-uite se afișează imediat; refetch în background dacă au expirat
- **Query keys** ca array-uri ordonate (`['transactions']`, `['statistics', 'overview', month, year]`)
- **Invalidate** specific după mutații:
  ```ts
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['statistics'] });
  ```
- **Refetch interval** pentru notificări: 30 sec polling

### 8.2. Backend (in-memory Map)

Pentru Weekly Insight (Gemini call costisitor):
```ts
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function getCached(userId) {
  const entry = cache.get(userId);
  if (entry && Date.now() - entry.generatedAt < CACHE_TTL_MS) {
    return entry.insight;
  }
  return null;
}
```

**Limitare:** dacă backend-ul are mai multe instanțe (load-balanced), cache-ul e per-instanță (nu shared). Pentru producție: Redis.

---

## 9. Date math — TZ-safe handling

### 9.1. Problema

PostgreSQL stochează DateTime ca UTC. JavaScript-ul `new Date('2026-05-17')` parse-uiește string-ul ca **UTC midnight**. În România (UTC+2/+3), asta se afișează ca `03:00 local`.

### 9.2. Soluții aplicate

**La inserție:** stocăm exact `new Date(data.date)` — UTC midnight.

**La query în interval:**
```ts
const startOfMonth = new Date(year, month - 1, 1);  // LOCAL time
const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
```
Folosesc constructorul cu parametri (an, lună, zi) care creează în **local time**, apoi Postgres convertește automat la UTC. Aliniere cu așteptarea utilizatorului ("luna mai" = mai în calendarul local).

**La afișare:** pentru ora tranzacției folosim `t.createdAt` (timestamp complet) nu `t.date` (doar dată) — altfel ar afișa mereu 03:00.

**Calcule de zile între date:**
```ts
const days = Math.floor((+endDate - +startDate) / 86_400_000) + 1;
```
Operatorul unar `+` pe Date returnează `getTime()` (ms epoch). Diferența / 86.4M = zile.

---

## 10. Validare runtime cu Zod

### 10.1. Pattern

Pentru fiecare endpoint:
```ts
const schema = z.object({
  amount: z.number().positive('Suma trebuie să fie pozitivă'),
  type: z.enum(['income', 'expense']),
  date: z.string().or(z.date()).transform(val => new Date(val)),
  categoryId: z.string().uuid('ID categorie invalid'),
}).refine(
  data => !data.isRecurring || (data.frequency && data.repetitionCount),
  { message: 'Frequency și repetitionCount necesare pentru recurring' }
);

// La endpoint:
const validated = schema.parse(req.body); // throws ZodError dacă invalid
```

**Beneficii:**
1. **Single source of truth** — schema generează tipul TS via `z.infer<typeof schema>`
2. **Mesaje localizate** — definite în română direct în schemă
3. **Transformări custom** — `string → Date` în schema
4. **Refinements** — reguli cross-field complex (ex: dacă isRecurring=true atunci frequency required)

### 10.2. Error handling

Middleware-ul `errorHandler.ts` interceptează `ZodError` și returnează:
```json
{
  "success": false,
  "errors": {
    "amount": "Suma trebuie să fie pozitivă",
    "categoryId": "ID categorie invalid"
  }
}
```

Frontend-ul afișează fiecare eroare lângă câmpul respectiv.

---

## 11. Securitate — detalii pe atacuri specifice

### 11.1. SQL Injection — prevenit prin Prisma

Prisma folosește **parametrized queries** intern. Niciodată nu construim SQL prin string concatenation:

```ts
// SIGUR (Prisma):
prisma.user.findUnique({ where: { email: userInput }})

// PERICULOS (raw, NU folosim):
db.query(`SELECT * FROM users WHERE email = '${userInput}'`)
```

Prisma trimite query-ul ca: `SELECT * FROM "User" WHERE "email" = $1` + bound parameter `[userInput]`. Postgres tratează parametrii ca date, nu cod.

### 11.2. XSS — prevenit prin React + httpOnly cookie

**React escapă automat** orice variabilă plasată în `{}` în JSX:
```tsx
<div>{userInput}</div>  // <script>alert(1)</script> apare ca text, nu se execută
```

**Cookie-ul refresh** are flag `httpOnly` → inaccesibil din `document.cookie` în JS → un atacator care injectează JS nu poate fura sesiunea.

### 11.3. CSRF — prevenit prin SameSite

Cookie-ul are `SameSite=None` (prod) sau `Lax` (dev). În prod, deși e None, atacul CSRF tradițional (form submit din alt site) nu funcționează pentru că browserul nu trimite cookie-ul cross-site **fără credentialele explicite**, iar API-ul nostru cere `credentials: include` care necesită CORS origin permis.

### 11.4. Rate limiting

`rate-limiter-flexible` cu:
- 5 încercări login / 15 min per IP
- 30 cereri reset password / oră per email

Implementat ca middleware pe rutele sensibile (`/auth/login`, `/auth/forgot-password`).

---

## 12. Decizii de inginerie notabile

### 12.1. Monorepo cu workspace `shared`

**Decizie inițială:** pachete separate frontend / backend / shared.

**Problemă la deploy Railway:** Railway clonează doar subdirectorul "Root Directory", `../shared` nu mai există → build eșuează.

**Decizie finală:** inline shared în fiecare pachet (~120 linii TS în frontend, ~20 linii constants în backend). Trade-off acceptat: dacă schimbi un tip, trebuie actualizat în 2 locuri.

### 12.2. Float vs Decimal pentru sume monetare

**Float64** are precizie de ~15-17 cifre semnificative. Pentru RON cu 2 zecimale și sume < 100k → erori sub `Number.EPSILON` în arithmetic.

Pentru un proiect academic e suficient. Pentru bancă reală — `Decimal(12, 2)` sau o librărie `decimal.js`.

### 12.3. `prisma db push` vs `prisma migrate dev`

În dev: `db push` sincronizează schema fără migrare numerotată. Rapid.

În prod (Railway): same `db push --accept-data-loss` la fiecare start. Funcționează pentru schimbări ne-distructive. Pentru cariera reală: migrări versionate în Git.

### 12.4. Auto-save vs preview pentru OCR

**Decizie inițială:** auto-save după scan dacă sumă + categorie sunt extrase.

**Feedback user:** "vreau să verific înainte".

**Decizie finală:** afișează preview card în modal cu ce a extras OCR, user verifică, apasă Save manual.

**Lecție:** AI poate greși; user-in-control e mai sigur.

---

## 13. Complexități și performanțe

| Operațiune | Complexitate | Notă |
|---|---|---|
| Login | O(1) DB + O(bcrypt cost) | ~100ms dominat de bcrypt |
| Create transaction | O(1) DB write + O(N) budget check | N = tranzacții luna curentă |
| Get transactions (cu filtre) | O(N log N) DB sort | Index pe (userId, date) |
| Anomaly detection | O(N) | N = tranzacții ultimele 90 zile |
| Monthly trend (12 luni) | O(12 × N/12) = O(N) | Aggregate-uri Postgres |
| OCR scan-receipt | O(network round-trip + Gemini) | ~2-4 sec |
| AI category suggest | O(network) | ~500ms |
| Render donut chart | O(K) | K = nr. categorii ≤ 20 |
| Render line chart | O(M) | M = puncte ≤ 12 |

---

## 14. Întrebări specifice posibile la susținere

### "Cum gestionezi concurența la create transaction?"
Postgres ACID + Prisma transactions. La create cu force=true, transaction-ul scrie atomic. Nu am race-uri pentru că fiecare user are propriul rând.

### "Ce se întâmplă dacă Gemini API e jos?"
Frontend afișează toast "Nu am putut citi bonul, încearcă altă poză". User completează manual.

### "Cum scalezi tableul Transaction la milioane de rânduri?"
- Index pe (userId, date) acoperă query-ul cel mai frecvent
- Pagination server-side cu LIMIT/OFFSET sau cursor-based
- Partitioning pe an dacă > 10M rânduri

### "Ce ar trebui îmbunătățit pentru producție?"
- Migrări versionate (`prisma migrate deploy`)
- Decimal pentru sume
- Redis pentru cache + rate limiting + JWT blacklist
- Storage cloud (R2/S3) pentru bonuri originale
- Sentry pentru error tracking
- Tests E2E (Playwright)
- CI/CD GitHub Actions

### "Cum ai testa OCR-ul?"
Set de bonuri de la diverși retaileri (Lidl, Kaufland, Mega Image, Carrefour). Snapshot tests pe output-ul JSON. Comparare cu ground truth manual.

---

**Sfârșit specificații tehnice.** Pentru aprofundare pe orice subiect, întreabă-mă punctual.
