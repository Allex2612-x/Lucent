# Deploy pe Railway — Ghid pas cu pas

> Pași concreți pentru a publica FARO (frontend + backend + PostgreSQL) pe [Railway.app](https://railway.app).

La final vei avea trei URL-uri publice:
- `https://faro-backend-XXXX.up.railway.app` — API
- `https://faro-frontend-XXXX.up.railway.app` — aplicația web
- O bază Postgres internă (nu expusă public)

---

## 0. Pregătire (5 min)

Ai nevoie de:
- Cont GitHub cu repo-ul aplicației push-uit.
- Cont Railway — vezi [railway.app](https://railway.app). Conectează-l la GitHub.
- Cheie Gemini API gratuită — generează una la [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Free tier 1000 requests/zi.
- (Opțional) credentiale Google + Facebook OAuth dacă vrei "Sign in with Google".

Generează două secrete JWT random:
```bash
openssl rand -hex 32   # rulează de 2 ori, salvează rezultatele
```

---

## 1. Creează proiectul în Railway

1. Pe [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo** → selectează repo-ul tău.
2. La prima conexiune Railway va vrea să creeze automat un singur serviciu. **Anulează asta** — vom crea manual 3 servicii separate.
3. În proiect, click **New** → **Database** → **Add PostgreSQL**. Railway îl provizionează imediat. Așteaptă ~30 sec.

---

## 2. Adaugă serviciul **Backend**

1. În proiect → **New** → **GitHub Repo** → același repo.
2. Click pe serviciul nou creat → **Settings** tab:
   - **Service Name:** `faro-backend`
   - **Root Directory:** `backend`
   - **Build Command:** lasă necompletat (Railway citește din `backend/railway.json`)
   - **Start Command:** lasă necompletat (citește din `railway.json`)
3. Tab **Variables** → adaugă următoarele (poți copia-paste cu butonul **Raw Editor**):

   ```env
   NODE_ENV=production
   JWT_SECRET=<paste prima cheie openssl>
   JWT_REFRESH_SECRET=<paste a doua cheie openssl>
   GEMINI_API_KEY=<cheia ta de la aistudio>
   ```

4. Adaugă **Reference Variable** la DATABASE_URL:
   - Click **+ New Variable** → **Add Reference** → alege serviciul Postgres → `DATABASE_URL`. Railway va sincroniza automat.

5. **Important — variabilele pe care le completezi DUPĂ ce ai URL-urile publice** (vezi pasul 5):
   - `FRONTEND_URL` — URL-ul frontend-ului (vine la pasul 3)
   - `FRONTEND_ORIGIN` — același cu mai sus
   - `BACKEND_PUBLIC_URL` — URL-ul backend-ului (vine la pasul 2.6)

6. **Generate public domain:** Tab **Settings** → **Networking** → **Generate Domain**. Railway îți dă un URL gen `https://faro-backend-production-xxxx.up.railway.app`. **Salvează-l** — îl folosim la frontend.

7. Reintră la Variables și completează `BACKEND_PUBLIC_URL` cu URL-ul de mai sus.

---

## 3. Adaugă serviciul **Frontend**

1. În proiect → **New** → **GitHub Repo** → același repo.
2. Click pe serviciul nou → **Settings**:
   - **Service Name:** `faro-frontend`
   - **Root Directory:** `frontend`
3. Tab **Variables**:

   ```env
   VITE_API_ORIGIN=https://faro-backend-production-xxxx.up.railway.app
   ```

   (Folosește URL-ul exact al backend-ului din pasul 2.6, fără slash la final.)

4. **Generate public domain:** Settings → Networking → Generate Domain. Salvează URL-ul gen `https://faro-frontend-production-xxxx.up.railway.app`.

---

## 4. Completează URL-urile reciproce

Acum că ai URL-urile, întoarce-te la **serviciul backend → Variables** și completează:

```env
FRONTEND_URL=https://faro-frontend-production-xxxx.up.railway.app
FRONTEND_ORIGIN=https://faro-frontend-production-xxxx.up.railway.app
```

Salvează. Railway va redeployment-a automat backend-ul cu noile variabile.

---

## 5. Verifică deploy-ul

1. Backend health: deschide `https://faro-backend-xxxx.up.railway.app/api/health` — ar trebui să vezi `{"status":"ok",...}`.
2. Frontend: deschide URL-ul frontend-ului — ar trebui să apară pagina de login.
3. **Înregistrează un cont nou** și verifică că merge tot fluxul: login, adăugare tranzacție, buget, scanare bon (dacă ai GEMINI_API_KEY setat).

---

## 6. (Opțional) Configurează OAuth

### Google

1. [Google Cloud Console](https://console.cloud.google.com/) → **Create project** → **APIs & Services** → **Credentials** → **Create OAuth client ID** → **Web application**.
2. **Authorized redirect URIs:**
   ```
   https://faro-backend-xxxx.up.railway.app/api/auth/google/callback
   ```
3. Salvează `Client ID` și `Client Secret`. În Railway → backend → Variables:
   ```env
   GOOGLE_CLIENT_ID=<...>
   GOOGLE_CLIENT_SECRET=<...>
   ```

### Facebook

1. [Facebook Developers](https://developers.facebook.com/) → **My Apps** → **Create App** → **Consumer**.
2. **Facebook Login** → **Settings** → **Valid OAuth Redirect URIs:**
   ```
   https://faro-backend-xxxx.up.railway.app/api/auth/facebook/callback
   ```
3. Salvează `App ID` și `App Secret`. În Railway:
   ```env
   FACEBOOK_APP_ID=<...>
   FACEBOOK_APP_SECRET=<...>
   ```

După salvare backend-ul se redeploy. Butonele Google/Facebook vor apărea automat pe pagina de login (sunt afișate doar dacă `/api/auth/providers` raportează `true`).

---

## 7. Domenii custom (opțional)

În Railway → serviciu → Settings → Networking → **Custom Domain** → adaugă `app.faro.ro` (sau ce ai tu). Railway îți dă instrucțiuni DNS (CNAME).

După adăugare, actualizează `FRONTEND_URL` și `VITE_API_ORIGIN` cu noile domenii.

---

## 8. Cum funcționează deploy-ul (sub capotă)

### Schema DB
- Folosim **`prisma db push --skip-generate --accept-data-loss`** la fiecare start. E suficient pentru proiect academic.
- Pentru producție serioasă: migrează la `prisma migrate deploy` cu fișiere de migrare versionate în Git.
- ⚠️ `--accept-data-loss` permite modificări destructive. Dacă faci o schimbare care ar șterge date (ex: redenumire coloană), DB-ul **se va modifica** la următorul start.

### Build sequence (citește din `railway.json`)
- **Backend:** `cd ../shared && npm install && npm run build && cd ../backend && npm install && npm run build`
  - Construiește mai întâi pachetul `shared` (tipuri TypeScript partajate).
  - Apoi compilează backend-ul TS → `dist/`.
  - `postinstall` rulează automat `prisma generate`.
- **Frontend:** Identic, dar pentru frontend. Output: `dist/` cu HTML + JS bundle.

### Runtime
- **Backend:** `npm start` = `prisma db push && node dist/server.js`. Schema se sincronizează la fiecare start.
- **Frontend:** `npm start` = `serve -s dist -l $PORT`. SPA fallback automat (toate rutele → `index.html`).

### Cookie-uri și CORS
- În producție (`NODE_ENV=production`) folosim:
  - `Secure: true` — cookie-ul refresh doar peste HTTPS.
  - `SameSite: 'none'` — necesar pentru cross-origin (backend pe alt subdomeniu decât frontend).
  - `app.set('trust proxy', 1)` — Railway termină TLS la edge, Express trebuie să creadă în `X-Forwarded-Proto`.
- CORS acceptă origin-ul din `FRONTEND_URL` (comma-separated dacă ai mai multe deploy-uri).

---

## 9. Costuri estimate

Railway free tier:
- $5 credit gratuit la înregistrare.
- După consumare: ~$5/lună pentru Postgres + 2 servicii cu trafic mic.
- Pentru proiect academic / demo: gratuit pentru primele câteva luni.

---

## 10. Troubleshooting

### "CORS blocked for origin ..."
Variabila `FRONTEND_URL` din backend e greșită sau lipsește. Verifică să fie **exact** URL-ul public al frontend-ului (cu `https://`, fără slash final).

### "Refresh token not found" la fiecare request
- Verifică că `NODE_ENV=production` e setat pe backend (altfel cookie-ul nu folosește `SameSite=None`).
- În browser DevTools → Application → Cookies — verifică că `refreshToken` are atribute `Secure` și `SameSite=None`.

### Deploy eșuează la `npm install` în backend
- Verifică că dosarul `shared/` există în repo.
- Verifică că `shared/package.json` are scriptul `build`.

### Schema DB nu se actualizează
- Verifică log-urile serviciului backend la start — caută linii de la `prisma db push`.
- Forțează un redeploy: în Railway → service → meniu (3 puncte) → **Redeploy**.

### `/scan-receipt` returnează 500
- `GEMINI_API_KEY` nu e setat sau expirat.
- Verifică-l la [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### Bonurile scanate apar dar nu se persistă pozele
**Este intenționat.** Versiunea curentă nu mai salvează poza originală — extrage și stochează doar **datele structurate** (line items, totaluri) ca JSON în coloana `Transaction.receiptData`. Câmpul `receiptUrl` rămâne în schema pentru backward compat dar nu mai e populat.

---

## 11. Comenzi utile pe Railway

Din terminal local cu Railway CLI (`npm i -g @railway/cli`):

```bash
railway login                          # autentificare
railway link                           # leagă folder local de proiect
railway logs                           # log-uri în timp real
railway run npm start                  # rulează local cu env vars din Railway
railway run npx prisma studio          # DB GUI cu env vars din prod (atenție!)
railway shell                          # shell în containerul de prod
```

---

## 12. Update după push în GitHub

Railway monitorizează branch-ul `main` (default). Fiecare push declanșează un nou build + deploy automat. Vezi statusul în tab-ul **Deployments** al fiecărui serviciu.

Pentru a opri auto-deploy: Settings → **Auto Deploy** → toggle off.

---

## Sumar variabile de mediu

### Backend service
| Variabilă | Sursă | Exemplu |
|---|---|---|
| `NODE_ENV` | Manual | `production` |
| `PORT` | **Auto (Railway)** | — |
| `DATABASE_URL` | **Reference la Postgres** | — |
| `JWT_SECRET` | `openssl rand -hex 32` | 64 hex chars |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 32` | 64 hex chars |
| `FRONTEND_URL` | URL frontend Railway | `https://faro-frontend-xxx.up.railway.app` |
| `FRONTEND_ORIGIN` | Identic cu mai sus | — |
| `BACKEND_PUBLIC_URL` | URL backend Railway | `https://faro-backend-xxx.up.railway.app` |
| `GEMINI_API_KEY` | aistudio.google.com | — |
| `GOOGLE_CLIENT_ID` (opt) | Google Cloud | — |
| `GOOGLE_CLIENT_SECRET` (opt) | Google Cloud | — |
| `FACEBOOK_APP_ID` (opt) | Facebook Developers | — |
| `FACEBOOK_APP_SECRET` (opt) | Facebook Developers | — |

### Frontend service
| Variabilă | Sursă | Exemplu |
|---|---|---|
| `PORT` | **Auto (Railway)** | — |
| `VITE_API_ORIGIN` | URL backend Railway | `https://faro-backend-xxx.up.railway.app` |

### Postgres service (Railway plugin)
Nimic de configurat — Railway expune `DATABASE_URL` automat ca reference variable.

---

**Gata!** Dacă ai întrebări specifice pe parcurs, scrie-mi.
