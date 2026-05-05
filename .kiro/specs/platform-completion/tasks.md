# Plan de Implementare: Finalizarea Platformei Sasha

## Prezentare Generală

Implementarea completează platforma „Sasha" pornind de la baza existentă (auth, CRUD tranzacții/categorii/bugete, design system, flow auth web și mobile). Pașii sunt organizați astfel încât fiecare task să construiască pe cel anterior, fără cod orfan: mai întâi backend-ul nou, apoi serviciile frontend, layout-ul, paginile conectate la API real, ecranele mobile și în final configurația de deploy.

## Tasks

- [x] 1. Backend — Modulul Statistics
  - [x] 1.1 Creează `backend/src/modules/statistics/statistics.service.ts`
    - Implementează `StatisticsService.getOverview(userId, month?, year?)`: query Prisma cu SUM pe `amount` grupat după `type`, returnează `{ totalIncome, totalExpenses, balance, transactionCount }`
    - Implementează `StatisticsService.getByCategory(userId, startDate?, endDate?, type?)`: GROUP BY `categoryId`, JOIN `Category` pentru `name` și `color`, calculează `percentage = (categoryTotal / grandTotal) * 100`, sortează DESC după `total`
    - Implementează `StatisticsService.getMonthlyTrend(userId, months = 6)`: generează array de `{month, year}` pentru ultimele N luni, calculează SUM income și SUM expenses per lună, returnează ordonat cronologic ASC
    - _Requirements: 1.1, 1.2, 1.3, 1.6_

  - [ ]* 1.2 Scrie property test pentru `getOverview` — invariantul balance
    - **Property 1: balance = totalIncome - totalExpenses**
    - **Validates: Requirements 1.1**
    - Folosește `vitest` + `fast-check`; generează array arbitrar de tranzacții, inserează în DB de test, verifică că `result.balance ≈ result.totalIncome - result.totalExpenses` (toleranță 2 zecimale)

  - [ ]* 1.3 Scrie property test pentru `getByCategory` — suma procentelor = 100%
    - **Property 2: suma câmpului `percentage` din toate elementele ≈ 100**
    - **Validates: Requirements 1.2**
    - Generează tranzacții cu categorii dintr-un set fix (max 5), verifică că `result.reduce((s, c) => s + c.percentage, 0) ≈ 100` (toleranță 0.5%)

  - [ ]* 1.4 Scrie property test pentru `getMonthlyTrend` — ordine cronologică strictă
    - **Property 3: fiecare element are `year * 12 + month` mai mare decât precedentul**
    - **Validates: Requirements 1.3**
    - Generează `months` arbitrar (1–12), verifică că array-ul returnat are exact `months` elemente și că sunt strict crescătoare

  - [x] 1.5 Creează `backend/src/modules/statistics/statistics.controller.ts`
    - Implementează `StatisticsController.getOverview`, `getByCategory`, `getMonthlyTrend`
    - Validare Zod pentru query params: `overviewSchema`, `byCategorySchema`, `monthlyTrendSchema` (conform design)
    - Returnează `res.json({ success: true, data: result })`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.6 Creează `backend/src/modules/statistics/statistics.routes.ts`
    - `GET /` → `StatisticsController.getOverview` (cu `requireAuth`)
    - `GET /by-category` → `StatisticsController.getByCategory` (cu `requireAuth`)
    - `GET /monthly-trend` → `StatisticsController.getMonthlyTrend` (cu `requireAuth`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Backend — Modulul Reports
  - [x] 2.1 Creează `backend/src/modules/report/report.service.ts`
    - Implementează `ReportService.generatePDF(userId, startDate?, endDate?) → Buffer`
      - Fetch tranzacții din Prisma cu filtre de dată și `include: { category: true }`
      - Calculează sumar (totalIncome, totalExpenses, balance)
      - Construiește PDF cu `pdfkit`: header cu titlu + perioadă, secțiunea Sumar (3 rânduri), tabel Tranzacții (Data | Descriere | Tip | Categorie | Sumă)
      - Returnează Buffer
    - Implementează `ReportService.generateExcel(userId, startDate?, endDate?) → Buffer`
      - Fetch tranzacții cu aceleași filtre
      - Construiește workbook cu `exceljs`: sheet „Tranzacții" (coloane: Data, Descriere, Tip, Categorie, Sumă), sheet „Sumar" (totaluri pe categorii)
      - Returnează Buffer
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 2.2 Creează `backend/src/modules/report/report.controller.ts`
    - `ReportController.exportPDF`: setează `Content-Type: application/pdf` și `Content-Disposition: attachment; filename="raport-financiar-{YYYY-MM}.pdf"`, trimite buffer-ul
    - `ReportController.exportExcel`: setează `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` și `Content-Disposition: attachment; filename="raport-financiar-{YYYY-MM}.xlsx"`, trimite buffer-ul
    - _Requirements: 2.1, 2.2_

  - [x] 2.3 Creează `backend/src/modules/report/report.routes.ts`
    - `GET /export/pdf` → `ReportController.exportPDF` (cu `requireAuth`)
    - `GET /export/excel` → `ReportController.exportExcel` (cu `requireAuth`)
    - _Requirements: 2.1, 2.2, 2.4_

- [x] 3. Backend — Modulul Notifications
  - [x] 3.1 Creează `backend/src/modules/notification/notification.service.ts`
    - Implementează `NotificationService.checkAndCreateBudgetNotifications(userId, categoryId, transactionDate)`:
      - Găsește `BudgetCategory` pentru luna tranzacției
      - Calculează totalul cheltuielilor din categorie în luna curentă
      - Dacă `spent / limitAmount >= 1.0` și nu există notificare `budget_exceeded` necitită → creează
      - Dacă `spent / limitAmount >= 0.8` și `< 1.0` și nu există notificare `budget_near_limit` necitită → creează
    - Implementează `getNotifications(userId)`, `markAsRead(userId, id)`, `markAllAsRead(userId)`, `getUnreadCount(userId)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 3.2 Scrie property test pentru idempotența creării notificărilor
    - **Property 4: N apeluri `checkAndCreateBudgetNotifications` cu aceiași parametri produc cel mult 1 notificare necitită per tip/categorie/lună**
    - **Validates: Requirements 3.1, 3.2**
    - Generează `callCount` arbitrar (2–10), setup buget cu limita 100 RON și cheltuieli la 90 RON, verifică că `notifications.length === 1`

  - [ ]* 3.3 Scrie property test pentru idempotența `markAsRead`
    - **Property 5: N apeluri `markAsRead(id)` produc același rezultat ca un singur apel**
    - **Validates: Requirements 3.4**
    - Generează `callCount` arbitrar (1–10), verifică că `notification.isRead === true` după toate apelurile

  - [x] 3.4 Creează `backend/src/modules/notification/notification.controller.ts`
    - `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`
    - Returnează 404 dacă notificarea nu aparține utilizatorului autentificat
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.5 Creează `backend/src/modules/notification/notification.routes.ts`
    - `GET /` → `getNotifications` (cu `requireAuth`)
    - `GET /unread-count` → `getUnreadCount` (cu `requireAuth`)
    - `PATCH /:id/read` → `markAsRead` (cu `requireAuth`)
    - `PATCH /read-all` → `markAllAsRead` (cu `requireAuth`)
    - _Requirements: 3.3, 3.4, 3.5, 3.7_

  - [x] 3.6 Integrează `NotificationService` în `TransactionService`
    - Modifică `backend/src/modules/transaction/transaction.service.ts`
    - În `createTransaction` și `updateTransaction`, după `prisma.transaction.create/update`, dacă `data.type === 'expense'` apelează `NotificationService.checkAndCreateBudgetNotifications(userId, data.categoryId, new Date(data.date))`
    - _Requirements: 3.1, 3.2_

- [x] 4. Backend — Înregistrarea rutelor noi în `app.ts`
  - Modifică `backend/src/app.ts`:
    - Importă și înregistrează `statisticsRoutes` la `/api/statistics`
    - Importă și înregistrează `reportRoutes` la `/api/reports`
    - Importă și înregistrează `notificationRoutes` la `/api/notifications`
    - Actualizează configurația CORS: adaugă `process.env.FRONTEND_URL` în lista de origini permise (cu `.filter(Boolean)`)
  - _Requirements: 4.1, 15.4_

- [x] 5. Checkpoint — Verificare backend
  - Asigură-te că toate testele backend trec și că `npm run build` în `backend/` se execută fără erori TypeScript. Întreabă utilizatorul dacă apar probleme.

- [x] 6. Frontend — Servicii API
  - [x] 6.1 Actualizează `frontend/src/services/api.ts`
    - Înlocuiește `baseURL: '/api'` cu `baseURL: import.meta.env.VITE_API_URL || '/api'`
    - _Requirements: 4.7, 16.2_

  - [x] 6.2 Creează `frontend/src/services/transactions.service.ts`
    - Exportă obiectul `transactionsService` cu metodele: `getAll(filters?)`, `create(data)`, `update(id, data)`, `delete(id)`
    - Toate metodele folosesc instanța `api` din `./api`
    - _Requirements: 4.2_

  - [x] 6.3 Creează `frontend/src/services/categories.service.ts`
    - Exportă `categoriesService` cu: `getAll()`, `create(data)`, `update(id, data)`, `delete(id)`
    - _Requirements: 4.3_

  - [x] 6.4 Creează `frontend/src/services/budgets.service.ts`
    - Exportă `budgetsService` cu: `getAll()`, `create(data)`, `update(id, data)`, `delete(id)`
    - _Requirements: 4.4_

  - [x] 6.5 Creează `frontend/src/services/statistics.service.ts`
    - Exportă `statisticsService` cu: `getOverview(params?)`, `getByCategory(params?)`, `getMonthlyTrend(params?)`
    - _Requirements: 4.5_

  - [x] 6.6 Creează `frontend/src/services/notifications.service.ts`
    - Exportă `notificationsService` cu: `getAll()`, `getUnreadCount()`, `markAsRead(id)`, `markAllAsRead()`
    - _Requirements: 4.6_

- [x] 7. Frontend — Layout: Sidebar + Header + NotificationDropdown
  - [x] 7.1 Creează `frontend/src/components/layout/Sidebar.tsx`
    - Definește `navItems` cu link-urile: Dashboard (`/`), Tranzacții (`/transactions`), Bugete (`/budgets`), Categorii (`/categories`), Rapoarte (`/reports`), Setări (`/settings`), fiecare cu iconița corespunzătoare din `lucide-react`
    - Folosește `NavLink` din `react-router-dom` pentru evidențierea link-ului activ (clasa `active`)
    - Afișează logo-ul/titlul „Sasha" în partea superioară
    - _Requirements: 5.1, 5.5_

  - [x] 7.2 Creează `frontend/src/components/layout/NotificationDropdown.tsx`
    - `useQuery` pentru `notificationsService.getAll()` (primele 5 notificări)
    - Afișează fiecare notificare cu titlul, mesajul și data relativă
    - La click pe o notificare: apelează `notificationsService.markAsRead(id)` și navighează la `/budgets` pentru tipurile `budget_exceeded`/`budget_near_limit`
    - _Requirements: 5.3, 5.4_

  - [x] 7.3 Creează `frontend/src/components/layout/Header.tsx`
    - `useQuery` pentru `notificationsService.getUnreadCount()` cu `refetchInterval: 30000`
    - Afișează Notification_Bell cu badge-ul numărului de notificări necitite
    - Toggle `NotificationDropdown` la click pe bell
    - Afișează numele utilizatorului autentificat din `useAuthStore`
    - _Requirements: 5.2, 5.3_

  - [x] 7.4 Modifică `frontend/src/components/layout/MainLayout.tsx`
    - Înlocuiește `<Navbar />` cu structura `app-shell`: `<Sidebar />` + `<div className="main-area">` cu `<Header />` și `<main className="page-content"><Outlet /></main>`
    - _Requirements: 5.1, 5.2, 5.6_

  - [x] 7.5 Adaugă stilurile CSS în `frontend/src/index.css`
    - Adaugă clasele `.app-shell`, `.sidebar`, `.main-area`, `.page-content` conform design-ului (flex layout, sidebar 240px, overflow hidden)
    - _Requirements: 5.1, 5.6_

- [x] 8. Frontend — Actualizare rute
  - Modifică `frontend/src/routes/index.tsx`:
    - Importă și adaugă `<Route path="categories" element={<Categories />} />`
    - Importă și adaugă `<Route path="reports" element={<Reports />} />`
    - Importă și adaugă `<Route path="settings" element={<Settings />} />`
  - Creează fișierele placeholder `Categories.tsx`, `Reports.tsx`, `Settings.tsx` în directoarele respective dacă nu există (vor fi completate în task-urile următoare)
  - _Requirements: 5.1_

- [x] 9. Frontend — Dashboard conectat la API real
  - Modifică `frontend/src/features/dashboard/Dashboard.tsx`:
    - Înlocuiește `mockChartData` cu `useQuery` pentru `statisticsService.getMonthlyTrend({ months: 7 })` — mapează rezultatul la `{ name: 'Ian', income, expenses, balance }`
    - Înlocuiește valorile hardcodate din carduri cu `useQuery` pentru `statisticsService.getOverview({ month: currentMonth, year: currentYear })`
    - Înlocuiește `mockTransactions` cu `useQuery` pentru `transactionsService.getAll()` cu `select: (data) => data.data.data.slice(0, 5)`
    - Adaugă loading states (skeleton sau text „Se încarcă...") și error states cu mesaj vizibil
    - Elimină `useEffect` cu `setTimeout` și `dataLoaded` state
  - _Requirements: 6.1, 6.2, 6.3, 6.7, 6.8_

- [x] 10. Frontend — Pagina Transactions conectată la API real cu formular complet
  - Modifică `frontend/src/features/transactions/Transactions.tsx`:
    - Înlocuiește `useEffect` + `useState` cu `useQuery` pentru `transactionsService.getAll()`
    - Elimină `MOCK_TRANSACTIONS` și fallback-ul pe mock data
    - Completează formularul din Modal cu câmpurile lipsă: `type` (Select: Venit/Cheltuială) și `categoryId` (Select populat din `useQuery` pentru `categoriesService.getAll()`)
    - Adaugă `useMutation` pentru `transactionsService.create(data)` cu `onSuccess: () => { queryClient.invalidateQueries(['transactions']); queryClient.invalidateQueries(['statistics']); setIsAddModalOpen(false); }`
    - Adaugă butoane Editează/Șterge în tabel cu mutații corespunzătoare
    - Afișează eroare vizibilă dacă query-ul eșuează (fără fallback pe mock)
  - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 11. Frontend — Pagina Budgets completă
  - Rescrie `frontend/src/features/budgets/Budgets.tsx`:
    - `useQuery` pentru `budgetsService.getAll()`
    - Implementează componenta `BudgetProgress({ spent, limit })`: bară de progres cu culoare verde/galben/roșu în funcție de procent (< 80% / 80–100% / > 100%), `Math.min(pct, 100)` pentru afișare
    - Modal „Creează Buget" cu câmpurile: Luna (select 1–12), Anul (number), Limita Totală (number), cel puțin o categorie cu limita ei (posibilitate de a adăuga mai multe cu buton „+ Adaugă Categorie")
    - `useMutation` pentru `budgetsService.create(data)` cu invalidare query la succes
    - Modal „Editează Buget" pre-populat, `useMutation` pentru `budgetsService.update(id, data)`
    - Confirmare înainte de ștergere, `useMutation` pentru `budgetsService.delete(id)`
    - Calculează `spent` per buget din `statisticsService.getOverview({ month, year })` sau din tranzacțiile din cache
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 11.1 Scrie property test pentru componenta `BudgetProgress` — procentul nu poate fi negativ
    - **Property 6: `(spent / limit) * 100 >= 0` pentru orice `spent >= 0` și `limit > 0`**
    - **Validates: Requirements 7.1, 7.6**
    - Folosește `fast-check` cu `fc.float({ min: 0 })` și `fc.float({ min: 0.01 })`

- [x] 12. Frontend — Pagina Categories (nouă)
  - Creează `frontend/src/features/categories/Categories.tsx`:
    - `useQuery` pentru `categoriesService.getAll()`
    - Afișează două secțiuni: „Categorii Implicite" (filtrare după `isDefault: true`, read-only) și „Categoriile Mele" (filtrare după `isDefault: false`)
    - Fiecare categorie afișează: culoarea (pătrat colorat), iconița, numele, tipul (badge Venit/Cheltuială)
    - Butoanele Editează/Șterge sunt dezactivate (`disabled`) pentru categoriile implicite
    - Modal „Adaugă Categorie" cu câmpurile: Nume (text, min 2 caractere), Tip (select), Culoare (`<input type="color">`), Iconiță (text opțional)
    - `useMutation` pentru create, update, delete cu invalidare query la succes
    - Confirmare înainte de ștergere
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 13. Frontend — Pagina Reports (nouă)
  - Creează `frontend/src/features/reports/Reports.tsx`:
    - Selector de perioadă: două `<input type="month">` pentru lună start și lună sfârșit (state local `startDate`, `endDate`)
    - `useQuery` pentru `statisticsService.getByCategory({ startDate, endDate, type: 'expense' })` → `PieChart` Recharts cu distribuția cheltuielilor pe categorii
    - `useQuery` pentru `statisticsService.getMonthlyTrend({ months: 12 })` → `BarChart` Recharts cu venituri și cheltuieli lunare (două bare: income verde, expenses roșu)
    - Buton „Export PDF": apelează `api.get('/reports/export/pdf', { params: { startDate, endDate }, responseType: 'blob' })`, creează URL blob, declanșează descărcare automată, revocă URL
    - Buton „Export Excel": același pattern cu `responseType: 'blob'` și extensia `.xlsx`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 14. Frontend — Pagina Settings (nouă)
  - Creează `frontend/src/features/settings/Settings.tsx`:
    - `useQuery` pentru `api.get('/users/me')` → pre-populează formularul profil: Prenume, Nume, Email (input `disabled`), Monedă (select cu opțiuni comune: RON, EUR, USD)
    - `useMutation` pentru `api.patch('/users/me', data)` cu mesaj de succes toast/alert
    - Secțiune separată „Schimbă Parola" cu câmpurile: Parola Curentă, Parola Nouă (min 6 caractere), Confirmă Parola Nouă
    - Validare client-side: dacă „Confirmă Parola Nouă" ≠ „Parola Nouă" → afișează eroarea „Parolele nu coincid" fără a trimite request
    - `useMutation` pentru `api.patch('/users/me/password', data)` cu mesaj de succes/eroare
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15. Checkpoint — Verificare frontend web
  - Asigură-te că `npm run build` în `frontend/` se execută fără erori TypeScript. Verifică că toate paginile se randează corect și că rutele funcționează. Întreabă utilizatorul dacă apar probleme.

- [ ] 16. Mobile — Bottom Tab Navigator
  - Modifică `mobile/src/navigation/AppNavigator.tsx`:
    - Importă `createBottomTabNavigator` din `@react-navigation/bottom-tabs`
    - Creează `MainTabs` cu 4 tab-uri: Dashboard, Tranzacții, Bugete, Setări
    - Configurează `tabBarIcon` cu `Ionicons` din `@expo/vector-icons` (icons: `home`, `swap-horizontal`, `wallet`, `settings`)
    - Stilizare tab bar: `backgroundColor: '#1e293b'`, `borderTopColor: '#334155'`, `tabBarActiveTintColor: '#818cf8'`, `tabBarInactiveTintColor: '#94a3b8'`
    - Actualizează `AppNavigator`: dacă `isAuthenticated` → `<Stack.Screen name="Main" component={MainTabs} />`, altfel → `<Stack.Screen name="Login" component={LoginScreen} />`
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 17. Mobile — TransactionsScreen (nou)
  - Creează `mobile/src/features/transactions/TransactionsScreen.tsx`:
    - State: `transactions[]`, `loading`, `isModalVisible`, `categories[]`
    - `useEffect` → `api.get('/transactions')` → `setTransactions`; `api.get('/categories')` → `setCategories`
    - `ActivityIndicator` în timp ce `loading === true`
    - `FlatList` cu `renderItem`: data formatată, descriere, badge tip (Venit/Cheltuială), sumă colorată
    - FAB `+` (TouchableOpacity) → `setIsModalVisible(true)`
    - `Modal` cu formular: Descriere (`TextInput`), Sumă (`TextInput` numeric), Tip (`Picker` sau două butoane toggle), Categorie (`Picker` populat din `categories`), Data (`TextInput` cu format YYYY-MM-DD)
    - Submit → `api.post('/transactions', data)` → refresh list; eroare → `Alert.alert`
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 18. Mobile — BudgetsScreen (nou)
  - Creează `mobile/src/features/budgets/BudgetsScreen.tsx`:
    - State: `budgets[]`, `loading`
    - `useEffect` → `api.get('/budgets')` → `setBudgets`
    - `ActivityIndicator` în timp ce `loading === true`
    - `FlatList` cu `renderItem`: luna/an, limita totală, bară de progres (`View` cu `width` proporțional, culoare condiționată: verde/galben/roșu)
    - Empty state: `Text` cu mesajul „Nu ai configurat niciun buget. Accesează aplicația web pentru a crea bugete."
    - Eroare API → `Alert.alert`
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 19. Mobile — SettingsScreen (nou)
  - Creează `mobile/src/features/settings/SettingsScreen.tsx`:
    - State: `user` (din `useAuthStore` sau `api.get('/users/me')`)
    - Afișează: prenume, nume, email, monedă preferată în carduri read-only
    - Buton „Deconectare": apelează `api.post('/auth/logout')` în try/catch, execută `useAuthStore.getState().logout()` indiferent de rezultatul API, navighează la Login
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 20. Mobile — DashboardScreen conectat la API real
  - Modifică `mobile/src/features/dashboard/DashboardScreen.tsx`:
    - State: `overview` (`{ totalIncome, totalExpenses, balance }`), `loading`
    - `useEffect` → `api.get('/statistics/overview')` → `setOverview`
    - `ActivityIndicator` în timp ce `loading === true`
    - Afișează 3 carduri cu date reale: „Sold Curent" (`balance`), „Venituri" (`totalIncome`), „Cheltuieli" (`totalExpenses`), fiecare formatat cu moneda RON
    - Eroare API → `Alert.alert`
  - _Requirements: 6.1 (mobile), 11.5_

- [ ] 21. Mobile — Actualizare `api.ts` cu refresh token
  - Modifică `mobile/src/services/api.ts`:
    - Adaugă interceptor de response pentru 401: apelează `api.post('/auth/refresh')`, actualizează token-ul în `useAuthStore`, reîncearcă request-ul original
    - Dacă refresh eșuează: apelează `useAuthStore.getState().logout()`
  - _Requirements: 4.7_

- [ ] 22. Checkpoint — Verificare mobile
  - Asigură-te că aplicația mobilă compilează fără erori TypeScript (`npx tsc --noEmit` în `mobile/`). Verifică că navigarea și ecranele noi sunt funcționale. Întreabă utilizatorul dacă apar probleme.

- [ ] 23. Deploy — Configurație Railway (backend)
  - Creează `backend/Procfile`:
    ```
    web: npm run build && npx prisma migrate deploy && node dist/server.js
    ```
  - Creează `backend/railway.json` cu `startCommand: "node dist/server.js"` și `healthcheckPath: "/api/health"`
  - Verifică că `backend/package.json` conține scripturile `"build": "tsc -p tsconfig.json"` și `"start": "node dist/server.js"`
  - _Requirements: 15.1, 15.2, 15.3, 15.5_

- [ ] 24. Deploy — Configurație Vercel (frontend)
  - Creează `frontend/vercel.json`:
    ```json
    {
      "buildCommand": "npm run build",
      "outputDirectory": "dist",
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
    }
    ```
  - _Requirements: 16.1, 16.4_

- [ ] 25. Checkpoint final — Verificare completă
  - Asigură-te că `npm run build` trece în `backend/` și `frontend/` fără erori. Verifică că toate testele trec. Întreabă utilizatorul dacă apar probleme înainte de deploy.

## Note

- Task-urile marcate cu `*` sunt opționale și pot fi sărite pentru un MVP mai rapid
- Fiecare task referențiază cerințele specifice pentru trasabilitate
- Checkpoint-urile asigură validarea incrementală
- Property tests validează invarianți universali (balance, procente, ordine cronologică, idempotență)
- Unit tests validează exemple specifice și cazuri limită
- Modulele backend noi urmează același pattern ca cele existente (service → controller → routes)
- Toate serviciile frontend folosesc instanța `api` centralizată cu interceptori JWT existenți
