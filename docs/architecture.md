# Arhitectura Platformei de Gestionare a Finanțelor Personale

## 1. Prezentare Generală

Platforma permite utilizatorilor să urmărească veniturile și cheltuielile personale, să planifice bugete lunare și să vizualizeze evoluția financiară prin grafice interactive.

### Stack Tehnologic

| Componenta       | Tehnologie                          |
| ---------------- | ----------------------------------- |
| Backend          | Node.js + Express + TypeScript      |
| Baza de date     | PostgreSQL                          |
| ORM              | Prisma                              |
| Frontend Web     | React + TypeScript + Vite           |
| Mobile           | React Native + TypeScript (Expo)    |
| Autentificare    | JWT (Access Token + Refresh Token)  |
| Grafice          | Recharts (web) / react-native-chart-kit (mobile) |
| Export rapoarte  | pdfkit (PDF) / exceljs (Excel)      |
| OCR (opțional)   | Tesseract.js sau Google Vision API  |
| Notificări       | Firebase Cloud Messaging (push) + nodemailer (email) |

---

## 2. Arhitectura de Ansamblu

```
┌─────────────┐     ┌─────────────┐
│  Frontend    │     │   Mobile    │
│  React Web   │     │ React Native│
│  (Vite+TS)   │     │  (Expo+TS)  │
└──────┬───────┘     └──────┬──────┘
       │                    │
       │   HTTPS (REST)     │
       └────────┬───────────┘
                │
                ▼
       ┌────────────────┐
       │   API Gateway   │
       │   (Express.js)  │
       │   + Middleware   │
       └────────┬────────┘
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌──────────────┐
│ PostgreSQL  │   │ File Storage │
│  (Prisma)   │   │ (local/S3)   │
└─────────────┘   └──────────────┘
```

Comunicarea între clienți (web + mobile) și backend se face exclusiv prin **REST API** peste HTTPS. Ambii clienți consumă aceleași endpoint-uri.

---

## 3. Structura Bazei de Date (Schema Principală)

### 3.1 Diagrama Entitate-Relație

```
┌──────────────┐       ┌──────────────────┐
│    User      │       │    Category      │
├──────────────┤       ├──────────────────┤
│ id (PK)      │──┐    │ id (PK)          │
│ email        │  │    │ name             │
│ password     │  │    │ icon             │
│ firstName    │  │    │ color            │
│ lastName     │  │    │ type (income/    │
│ currency     │  │    │       expense)   │
│ avatarUrl    │  │    │ userId (FK)      │──┐
│ createdAt    │  │    │ isDefault        │  │
│ updatedAt    │  │    │ createdAt        │  │
└──────────────┘  │    └──────────────────┘  │
                  │                          │
                  │    ┌──────────────────┐   │
                  │    │   Transaction    │   │
                  │    ├──────────────────┤   │
                  ├───▶│ id (PK)          │   │
                  │    │ amount           │   │
                  │    │ type (income/    │   │
                  │    │       expense)   │   │
                  │    │ description      │   │
                  │    │ date             │   │
                  │    │ categoryId (FK)  │◀──┘
                  │    │ userId (FK)      │
                  │    │ receiptUrl       │
                  │    │ isRecurring      │
                  │    │ createdAt        │
                  │    └──────────────────┘
                  │
                  │    ┌──────────────────┐
                  │    │     Budget       │
                  │    ├──────────────────┤
                  ├───▶│ id (PK)          │
                  │    │ month            │
                  │    │ year             │
                  │    │ totalLimit       │
                  │    │ userId (FK)      │
                  │    │ createdAt        │
                  │    └────────┬─────────┘
                  │             │
                  │             │ 1:N
                  │             ▼
                  │    ┌──────────────────┐
                  │    │ BudgetCategory   │
                  │    ├──────────────────┤
                  │    │ id (PK)          │
                  │    │ budgetId (FK)    │
                  │    │ categoryId (FK)  │
                  │    │ limitAmount      │
                  │    │ createdAt        │
                  │    └──────────────────┘
                  │
                  │    ┌──────────────────┐
                  │    │  Notification    │
                  │    ├──────────────────┤
                  └───▶│ id (PK)          │
                       │ userId (FK)      │
                       │ type (budget_    │
                       │   exceeded /     │
                       │   bill_reminder) │
                       │ title            │
                       │ message          │
                       │ isRead           │
                       │ relatedEntityId  │
                       │ createdAt        │
                       └──────────────────┘
```

### 3.2 Relații

| Relație                  | Tip   | Descriere                                      |
| ------------------------ | ----- | ---------------------------------------------- |
| User → Transaction       | 1:N   | Un utilizator are multe tranzacții             |
| User → Category          | 1:N   | Un utilizator are categorii personalizate      |
| User → Budget            | 1:N   | Un utilizator poate avea bugete lunare          |
| User → Notification      | 1:N   | Un utilizator primește notificări              |
| Category → Transaction   | 1:N   | O categorie poate avea multe tranzacții        |
| Budget → BudgetCategory  | 1:N   | Un buget conține limite pe categorii           |
| Category → BudgetCategory| 1:N   | O categorie poate fi în mai multe bugete       |

---

## 4. Arhitectura Backend (Node.js + Express)

### 4.1 Structura pe Layere

```
backend/
├── src/
│   ├── config/           # Configurare (DB, env, constante)
│   ├── middleware/        # Auth, error handling, validation
│   ├── modules/          # Feature modules (modular architecture)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.validation.ts
│   │   │   └── auth.types.ts
│   │   ├── user/
│   │   ├── transaction/
│   │   ├── category/
│   │   ├── budget/
│   │   ├── notification/
│   │   ├── report/
│   │   └── ocr/
│   ├── shared/           # Utilități comune, helpers
│   ├── prisma/           # Schema Prisma + migrări
│   └── app.ts            # Entry point
├── tests/
├── .env
├── tsconfig.json
└── package.json
```

### 4.2 Pattern: Controller → Service → Repository

Fiecare modul urmează pattern-ul **3-layer**:

1. **Controller** – parsează request-ul, validează input-ul, returnează response
2. **Service** – logica de business (calcule buget, verificare depășire, etc.)
3. **Repository** – interacțiune cu baza de date (Prisma Client)

### 4.3 Endpoint-uri REST API principale

#### Auth
| Metodă | Endpoint              | Descriere                  |
| ------ | --------------------- | -------------------------- |
| POST   | /api/auth/register    | Înregistrare utilizator    |
| POST   | /api/auth/login       | Autentificare              |
| POST   | /api/auth/refresh     | Reînnoire token            |
| POST   | /api/auth/logout      | Deconectare                |

#### User
| Metodă | Endpoint              | Descriere                  |
| ------ | --------------------- | -------------------------- |
| GET    | /api/users/me         | Profil utilizator curent   |
| PATCH  | /api/users/me         | Actualizare profil         |
| PATCH  | /api/users/me/password| Schimbare parolă           |

#### Transactions
| Metodă | Endpoint                        | Descriere                          |
| ------ | ------------------------------- | ---------------------------------- |
| GET    | /api/transactions               | Lista tranzacții (cu filtre, paginare) |
| POST   | /api/transactions               | Adăugare tranzacție                |
| GET    | /api/transactions/:id           | Detalii tranzacție                 |
| PATCH  | /api/transactions/:id           | Editare tranzacție                 |
| DELETE | /api/transactions/:id           | Ștergere tranzacție                |

#### Categories
| Metodă | Endpoint                        | Descriere                          |
| ------ | ------------------------------- | ---------------------------------- |
| GET    | /api/categories                 | Lista categorii                    |
| POST   | /api/categories                 | Creare categorie                   |
| PATCH  | /api/categories/:id             | Editare categorie                  |
| DELETE | /api/categories/:id             | Ștergere categorie                 |

#### Budgets
| Metodă | Endpoint                        | Descriere                          |
| ------ | ------------------------------- | ---------------------------------- |
| GET    | /api/budgets                    | Lista bugete                       |
| POST   | /api/budgets                    | Creare buget lunar                 |
| GET    | /api/budgets/:id                | Detalii buget                      |
| PATCH  | /api/budgets/:id                | Editare buget                      |
| DELETE | /api/budgets/:id                | Ștergere buget                     |

#### Statistics & Reports
| Metodă | Endpoint                              | Descriere                          |
| ------ | ------------------------------------- | ---------------------------------- |
| GET    | /api/statistics/overview              | Sumar financiar (venituri, cheltuieli, sold) |
| GET    | /api/statistics/by-category           | Cheltuieli pe categorii            |
| GET    | /api/statistics/monthly-trend         | Trend lunar                        |
| GET    | /api/reports/export/pdf               | Export PDF                         |
| GET    | /api/reports/export/excel             | Export Excel                       |

#### Notifications
| Metodă | Endpoint                        | Descriere                          |
| ------ | ------------------------------- | ---------------------------------- |
| GET    | /api/notifications              | Lista notificări                   |
| PATCH  | /api/notifications/:id/read     | Marcare ca citită                  |

#### OCR (opțional)
| Metodă | Endpoint                        | Descriere                          |
| ------ | ------------------------------- | ---------------------------------- |
| POST   | /api/ocr/scan                   | Upload imagine bon → extragere date|

---

## 5. Arhitectura Frontend Web (React + Vite)

### 5.1 Structura

```
frontend/
├── src/
│   ├── assets/           # Imagini, fonturi
│   ├── components/       # Componente reutilizabile (UI)
│   │   ├── ui/           # Butoane, Input, Modal, Card etc.
│   │   ├── charts/       # Componente grafice (Recharts)
│   │   └── layout/       # Header, Sidebar, Footer
│   ├── features/         # Feature-based modules
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── budgets/
│   │   ├── reports/
│   │   └── settings/
│   ├── hooks/            # Custom hooks
│   ├── services/         # API calls (axios/fetch)
│   ├── store/            # State management (Zustand)
│   ├── types/            # TypeScript types/interfaces
│   ├── utils/            # Helpers, formatters
│   ├── routes/           # React Router config
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### 5.2 Pagini Principale

| Pagină             | Rută                | Descriere                              |
| ------------------ | ------------------- | -------------------------------------- |
| Login              | /login              | Autentificare                          |
| Register           | /register           | Înregistrare                           |
| Dashboard          | /                   | Sumar financiar + grafice              |
| Tranzacții         | /transactions       | Lista + CRUD tranzacții                |
| Categorii          | /categories         | Gestionare categorii                   |
| Bugete             | /budgets            | Setare și monitorizare bugete          |
| Rapoarte           | /reports            | Grafice detaliate + export             |
| Setări             | /settings           | Profil, preferințe, monedă             |

### 5.3 State Management

- **Zustand** pentru state global (user, notifications)
- **React Query (TanStack Query)** pentru server state (tranzacții, categorii, bugete)
- Local state pentru formulare și UI

---

## 6. Arhitectura Mobile (React Native + Expo)

### 6.1 Structura

```
mobile/
├── src/
│   ├── assets/
│   ├── components/       # Componente reutilizabile
│   │   ├── ui/
│   │   ├── charts/
│   │   └── layout/
│   ├── features/         # Feature modules (screens + logic)
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── budgets/
│   │   └── settings/
│   ├── navigation/       # React Navigation config
│   ├── hooks/
│   ├── services/         # API calls
│   ├── store/            # Zustand
│   ├── types/
│   └── utils/
├── app.json
├── App.tsx
├── tsconfig.json
└── package.json
```

### 6.2 Navigare

```
Auth Stack (neautentificat)
├── LoginScreen
└── RegisterScreen

Main Tab Navigator (autentificat)
├── DashboardScreen      (tab: Acasă)
├── TransactionsScreen   (tab: Tranzacții)
│   └── AddTransactionScreen (modal)
│   └── TransactionDetailScreen
├── BudgetsScreen        (tab: Bugete)
│   └── BudgetDetailScreen
├── ReportsScreen        (tab: Rapoarte)
└── SettingsScreen       (tab: Setări)
```

---

## 7. Cod Partajat (Shared)

Deoarece backend, frontend și mobile folosesc toate TypeScript, vom avea un pachet opțional de tipuri partajate:

```
shared/
├── types/
│   ├── user.ts
│   ├── transaction.ts
│   ├── category.ts
│   ├── budget.ts
│   └── api.ts           # Request/Response types
└── constants/
    ├── categories.ts     # Categorii default
    └── currencies.ts
```

---

## 8. Autentificare & Securitate

### Flux Autentificare (JWT)

```
1. Client trimite POST /api/auth/login { email, password }
2. Server verifică credențialele
3. Server returnează { accessToken (15min), refreshToken (7 zile) }
4. Client stochează:
   - Web: accessToken în memorie, refreshToken în httpOnly cookie
   - Mobile: ambele în SecureStore (Expo)
5. La fiecare request protejat: Authorization: Bearer <accessToken>
6. La expirare accessToken → POST /api/auth/refresh cu refreshToken
```

### Middleware securitate
- **Helmet** – HTTP headers securizate
- **CORS** – restricționare origini
- **Rate limiting** – protecție brute-force
- **Zod** – validare input pe fiecare endpoint
- **bcrypt** – hashing parole

---

## 9. Notificări & Alerte

### Tipuri de notificări

| Tip                  | Trigger                                    | Canal          |
| -------------------- | ------------------------------------------ | -------------- |
| Budget depășit       | Cheltuielile depășesc limita categoriei    | Push + In-app  |
| Budget aproape de limită | Cheltuieli > 80% din limită           | Push + In-app  |
| Reminder factură     | Tranzacție recurentă aproape de scadență   | Push + Email   |
| Rezumat săptămânal   | Cron job duminica                          | Email          |

### Implementare
- **Cron jobs** (node-cron) verifică zilnic starea bugetelor
- **Firebase Cloud Messaging** pentru push notifications (mobile)
- **Web Push API** sau polling pentru web
- Notificările sunt stocate în DB pentru afișare in-app

---

## 10. Export Rapoarte

| Format | Librărie    | Conținut                                    |
| ------ | ----------- | ------------------------------------------- |
| PDF    | pdfkit      | Sumar financiar, tabel tranzacții, grafice  |
| Excel  | exceljs     | Sheet-uri separate: tranzacții, categorii, bugete |

Exportul se face server-side. Clientul primește un fișier descărcabil.

---

## 11. OCR (Opțional – Faza 2)

```
1. Utilizatorul fotografiază bonul (mobile) sau uploadează imaginea (web)
2. Imaginea se trimite la POST /api/ocr/scan
3. Backend procesează cu Tesseract.js (local) sau Google Vision API (cloud)
4. Se extrag: total, dată, comerciant, (opțional) produse individuale
5. Se pre-populează formularul de tranzacție nouă
6. Utilizatorul confirmă / editează și salvează
```

---

## 12. Deployment & Infrastructură

| Componentă     | Opțiune recomandată                 |
| -------------- | ----------------------------------- |
| Backend        | Railway / Render / VPS (Docker)     |
| PostgreSQL     | Railway Postgres / Supabase / Neon  |
| Frontend Web   | Vercel / Netlify                    |
| Mobile         | Expo EAS Build → App Store / Play Store |
| CI/CD          | GitHub Actions                      |
| Monitoring     | Sentry (error tracking)             |

---

## 13. Structura Completă a Proiectului

```
Licenta-Alexandru/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── user/
│   │   │   ├── transaction/
│   │   │   ├── category/
│   │   │   ├── budget/
│   │   │   ├── notification/
│   │   │   ├── report/
│   │   │   └── ocr/
│   │   ├── shared/
│   │   ├── prisma/
│   │   └── app.ts
│   ├── tests/
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── charts/
│   │   │   └── layout/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── categories/
│   │   │   ├── budgets/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   └── routes/
│   ├── public/
│   ├── tsconfig.json
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── charts/
│   │   │   └── layout/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── categories/
│   │   │   ├── budgets/
│   │   │   └── settings/
│   │   ├── navigation/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   ├── app.json
│   ├── tsconfig.json
│   └── package.json
├── shared/
│   ├── types/
│   └── constants/
├── docs/
│   └── architecture.md
└── README.md
```
