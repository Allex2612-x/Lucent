# OAuth Setup (Google + Facebook)

Butoanele de login social apar pe paginile `/login` și `/register` doar
dacă backend-ul găsește credențialele provider-ului. Activează unul sau
ambii furnizori urmând pașii de mai jos, apoi pune valorile în
`backend/.env`.

## Google

1. Mergi la <https://console.cloud.google.com/apis/credentials>.
2. Creează un proiect nou (sau alege unul existent).
3. **OAuth consent screen** → External → completează numele aplicației
   ("Sasha"), email-ul de suport, scopurile `email` + `profile`.
4. **Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:4000/api/auth/google/callback`
5. Copiază **Client ID** și **Client Secret** în `.env`:
   ```env
   GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="..."
   ```
6. Restart backend → butonul "Google" apare automat pe paginile de auth.

## Facebook

1. Mergi la <https://developers.facebook.com/apps/>.
2. **Create App** → Type: **Consumer** → numele aplicației.
3. În dashboard adaugă produsul **Facebook Login**.
4. **Facebook Login → Settings**:
   - Valid OAuth Redirect URIs: `http://localhost:4000/api/auth/facebook/callback`
5. **Settings → Basic** → copiază **App ID** și **App Secret** în `.env`:
   ```env
   FACEBOOK_APP_ID="..."
   FACEBOOK_APP_SECRET="..."
   ```
6. Restart backend → butonul "Facebook" apare automat.

## Pentru deploy în producție

Setează și:
```env
BACKEND_PUBLIC_URL="https://api.example.com"
FRONTEND_ORIGIN="https://app.example.com"
COOKIE_SECURE=true
NODE_ENV=production
```

Și adaugă URL-urile de producție în lista de Authorized redirect URIs la
fiecare provider (`https://api.example.com/api/auth/google/callback` etc.)

## Cum funcționează

- `GET /api/auth/providers` returnează `{google: bool, facebook: bool}` —
  frontend-ul folosește asta ca să arate/ascundă butoanele.
- `GET /api/auth/google` redirecționează utilizatorul către Google.
- După consimțământ, Google redirecționează înapoi la
  `/api/auth/google/callback`, noi verificăm profilul, găsim sau creăm
  user-ul după email, emitem JWT-ul nostru obișnuit și redirecționăm
  înapoi la `/login?oauth_token=<jwt>`.
- Frontend-ul (Login.tsx) detectează parametrul, salvează tokenul în
  store și trimite utilizatorul pe Dashboard.

User-ii creați prin OAuth au o parolă aleatoare necunoscută — pentru a
folosi login cu email/parolă vor trebui să facă reset.
