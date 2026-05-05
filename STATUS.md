# 📊 Status Proiect — Platformă de Gestiune a Finanțelor Personale

## 🚀 Cum se pornesc proiectele

### Shared (compilat o singură dată sau la modificări)
```bash
cd shared
npm install
npm run build
```

### Backend (Node.js + Express + Prisma)
```bash
cd backend
npm install

# Copiază env-ul (prima dată)
cp .env.example .env
# Editeaza .env cu credentialele PostgreSQL locale

# Ruleaza migrarile (necesita PostgreSQL activ)
npx prisma migrate dev

# Porneste serverul de development
npm run dev
# -> http://localhost:5000
```

### Frontend Web (React + Vite)
```bash
cd frontend
npm install
npm run dev
# -> http://localhost:5173
```

### Mobile (React Native + Expo)
```bash
cd mobile
npm install
npx expo start
# Scanează QR cu Expo Go (iOS/Android) sau apasă 'w' pentru web
```

---

## 📦 Structura Monorepo

```
sasha_licenta/
├── backend/          # Node.js + Express + TypeScript + Prisma
├── frontend/         # React + Vite + TypeScript
├── mobile/           # React Native + Expo + TypeScript
├── shared/           # Tipuri și constante comune (pachet local npm)
└── docs/
    └── architecture.md
```

---

## ✅ Status Implementare

### Backend
| Modul | Status | Note |
|-------|--------|------|
| Setup Express + Prisma | ✅ Done | `src/app.ts`, `src/server.ts` |
| Auth (register / login / logout) | ✅ Done | JWT dubblu (access 15m + refresh 7d) |
| Middleware Auth (requireAuth) | ✅ Done | |
| User module (me / update) | ✅ Done | |
| Transaction module (CRUD) | ✅ Done | |
| Category module (CRUD) | ✅ Done | |
| Budget module (CRUD) | ✅ Done | |
| Statistics / Reports | ⏳ Pending | |
| Notifications | ⏳ Pending | |
| OCR (opțional) | ⏳ Pending | Faza 2 |
| Prisma Migrations pe DB | ⚠️ Blocat | Necesită PostgreSQL local / cloud |

### Frontend Web
| Ecran / Component | Status | Note |
|---|---|---|
| Design System (CSS tokens, dark mode) | ✅ Done | `index.css` |
| UI Components (`Button`, `Card`, `Input`, `Modal`) | ✅ Done | `src/components/ui/` |
| Login / Register | ✅ Done | cu validare + error messages |
| Auth Store (Zustand + persist) | ✅ Done | `src/store/useAuthStore.ts` |
| Axios setup cu interceptori | ✅ Done | token atașat automat |
| PrivateRoute (protecție rute) | ✅ Done | |
| Dashboard (grafic Recharts + summary cards) | ✅ Done | mock data temporar |
| Tranzacții (tabel + Modal adăugare) | ✅ Done | mock data temporar |
| Bugete | ⏳ Pending | |
| Categorii | ⏳ Pending | |
| Rapoarte | ⏳ Pending | |
| Setări | ⏳ Pending | |

### Mobile (React Native + Expo)
| Ecran | Status | Note |
|---|---|---|
| Setup Expo + navigare | ✅ Done | |
| Auth Store (AsyncStorage) | ✅ Done | |
| Login Screen | ✅ Done | |
| Dashboard Screen | ✅ Done | |
| Tranzacții Screen | ⏳ Pending | |
| Bugete / Rapoarte / Setări | ⏳ Pending | |

### Shared
| Item | Status |
|---|---|
| Types: User, Transaction, Budget, Category | ✅ Done |
| Types: Notification, API responses | ✅ Done |
| Constants: categories default, currencies | ✅ Done |
| Build (dist/) | ✅ Done |

---

## ⚠️ Probleme cunoscute / Blocante

1. **PostgreSQL nu rulează local** — Backend-ul pornește dar crează eroare la orice request DB.
   - **Fix**: Instalează PostgreSQL local, sau folosește Docker (`docker-compose up -d`), sau una din opțiunile cloud free: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app)
   - Editează `backend/.env` cu `DATABASE_URL` corect
   - Rulează `cd backend && npx prisma migrate dev` o singură dată

2. **Date mock temporare** — Dashboard și Transactions folosesc mock data (hardcodat) până backend + DB sunt conectate.

3. **CSS index.css** are un bloc `/* Data Tables */` deschis și neînchis corect — a fost corectat dar trebuie verificat vizual.

---

## 🔧 Configurare `.env` Backend

```env
PORT=5000
DATABASE_URL="postgresql://postgres:parolataMea@localhost:5432/sasha_licenta?schema=public"
JWT_SECRET="schimba_asta_cu_ceva_secret"
JWT_REFRESH_SECRET="si_asta_de_asemenea"
NODE_ENV="development"
```

---

## 📋 Next Steps (Prioritizate)

- [ ] **1.** Pornire PostgreSQL (Docker sau cloud) + rulare `prisma migrate dev`
- [ ] **2.** Testare flow complet: Register → Login → Dashboard (date reale)
- [ ] **3.** Implementare pagini lipsă: Budgets, Categories, Reports, Settings
- [ ] **4.** Mobile: completare ecrane rămase
- [ ] **5.** Deploy: Railway (backend + DB) + Vercel (frontend)
