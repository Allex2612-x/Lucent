# Document de Cerințe — Finalizarea Platformei de Gestiune a Finanțelor Personale

## Introducere

Platforma de gestiune a finanțelor personale „Sasha" este o aplicație multi-platformă (web + mobile) cu backend Node.js/Express/Prisma. Baza solidă este deja implementată: autentificare JWT, CRUD pentru tranzacții, categorii și bugete, design system dark mode, flow de autentificare complet pe web și mobile.

Acest document definește cerințele pentru **finalizarea platformei**, acoperind:
1. **Backend** — modulele Statistics/Reports și Notifications (goale în prezent)
2. **Frontend Web** — layout complet (sidebar/header), servicii API reale, conectarea paginilor existente la API, paginile lipsă (Categories, Reports, Settings)
3. **Mobile** — ecranele lipsă (Transactions, Budgets, Settings) și integrarea API reală
4. **Deploy** — Railway (backend + PostgreSQL) + Vercel (frontend web)

Starea curentă: Dashboard-ul și pagina Transactions folosesc date mock hardcodate; nicio pagină nu este conectată la API real; modulele Statistics, Reports și Notifications din backend sunt goale.

---

## Glosar

- **System**: Platforma „Sasha" în ansamblu (backend + frontend + mobile)
- **Backend**: Serverul Node.js/Express/TypeScript/Prisma care expune REST API
- **Statistics_Service**: Modulul backend responsabil de calculul statisticilor financiare
- **Report_Service**: Modulul backend responsabil de generarea și exportul rapoartelor (PDF/Excel)
- **Notification_Service**: Modulul backend responsabil de crearea și gestionarea notificărilor in-app
- **Frontend**: Aplicația React/Vite/TypeScript care rulează în browser
- **Mobile_App**: Aplicația React Native/Expo/TypeScript
- **API_Client**: Instanța Axios configurată cu interceptori JWT (există deja în `frontend/src/services/api.ts` și `mobile/src/services/api.ts`)
- **TanStack_Query**: Librăria de server state management folosită în Frontend pentru cache și sincronizare date
- **Layout**: Componenta MainLayout cu Sidebar și Header din Frontend (parțial implementată — Navbar există, Sidebar lipsește)
- **Sidebar**: Componenta de navigare laterală a Frontend-ului (lipsă)
- **Notification_Bell**: Componenta UI din Header care afișează numărul de notificări necitite
- **Budget_Progress**: Componenta UI care afișează progresul cheltuielilor față de limita unui buget
- **RON**: Moneda implicită a platformei (Leu românesc)
- **Overview**: Sumarul financiar al utilizatorului (sold curent, venituri lunare, cheltuieli lunare)
- **Trend_Lunar**: Evoluția veniturilor și cheltuielilor pe ultimele N luni
- **Railway**: Platforma cloud folosită pentru deploy backend + PostgreSQL
- **Vercel**: Platforma cloud folosită pentru deploy frontend web

---

## Cerințe

### Cerința 1: Modulul Statistics — Endpoint-uri de statistici financiare

**User Story:** Ca utilizator autentificat, vreau să văd statistici financiare reale (sold curent, venituri, cheltuieli, evoluție lunară, distribuție pe categorii), astfel încât să înțeleg situația mea financiară.

#### Criterii de Acceptare

1. WHEN un utilizator autentificat trimite `GET /api/statistics/overview` cu parametrii opționali `month` și `year`, THE Statistics_Service SHALL returna un obiect JSON cu câmpurile: `totalIncome` (suma tuturor tranzacțiilor de tip `income` din perioada specificată), `totalExpenses` (suma tuturor tranzacțiilor de tip `expense`), `balance` (diferența `totalIncome - totalExpenses`) și `transactionCount` (numărul total de tranzacții).

2. WHEN un utilizator autentificat trimite `GET /api/statistics/by-category` cu parametrii opționali `startDate`, `endDate` și `type` (`income` sau `expense`), THE Statistics_Service SHALL returna un array de obiecte cu câmpurile `categoryId`, `categoryName`, `categoryColor`, `total` și `percentage` (procentul din totalul perioadei), sortat descrescător după `total`.

3. WHEN un utilizator autentificat trimite `GET /api/statistics/monthly-trend` cu parametrul opțional `months` (implicit 6, maxim 12), THE Statistics_Service SHALL returna un array de obiecte cu câmpurile `month`, `year`, `income`, `expenses` și `balance` pentru fiecare lună din intervalul solicitat, ordonat cronologic.

4. IF un utilizator neautentificat accesează orice endpoint din `/api/statistics`, THEN THE Backend SHALL returna HTTP 401 cu mesajul `Unauthorized`.

5. IF parametrul `months` din `GET /api/statistics/monthly-trend` depășește valoarea 12, THEN THE Statistics_Service SHALL returna HTTP 400 cu mesajul de validare corespunzător.

6. THE Statistics_Service SHALL calcula statisticile exclusiv pentru tranzacțiile aparținând utilizatorului autentificat, fără a expune date ale altor utilizatori.

---

### Cerința 2: Modulul Reports — Export PDF și Excel

**User Story:** Ca utilizator, vreau să export rapoartele financiare în format PDF sau Excel, astfel încât să pot arhiva sau prezenta situația financiară.

#### Criterii de Acceptare

1. WHEN un utilizator autentificat trimite `GET /api/reports/export/pdf` cu parametrii opționali `startDate` și `endDate`, THE Report_Service SHALL genera și returna un fișier PDF cu header-ul HTTP `Content-Type: application/pdf` și `Content-Disposition: attachment; filename="raport-financiar-{YYYY-MM}.pdf"`, conținând: sumarul financiar (venituri, cheltuieli, sold), tabelul tranzacțiilor din perioada specificată și distribuția cheltuielilor pe categorii.

2. WHEN un utilizator autentificat trimite `GET /api/reports/export/excel` cu parametrii opționali `startDate` și `endDate`, THE Report_Service SHALL genera și returna un fișier Excel cu header-ul HTTP `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` și `Content-Disposition: attachment; filename="raport-financiar-{YYYY-MM}.xlsx"`, conținând cel puțin două sheet-uri: „Tranzacții" (cu coloanele: Data, Descriere, Tip, Categorie, Sumă) și „Sumar" (cu totaluri pe categorii).

3. IF nu există tranzacții în perioada specificată pentru export, THEN THE Report_Service SHALL genera un document valid (PDF sau Excel) cu secțiunea de tranzacții goală și sumarul cu valori zero, fără a returna eroare.

4. IF un utilizator neautentificat accesează orice endpoint din `/api/reports`, THEN THE Backend SHALL returna HTTP 401.

5. THE Report_Service SHALL include în raport exclusiv tranzacțiile aparținând utilizatorului autentificat.

---

### Cerința 3: Modulul Notifications — Notificări in-app

**User Story:** Ca utilizator, vreau să primesc notificări in-app când cheltuielile depășesc sau se apropie de limita unui buget, astfel încât să pot lua măsuri corective la timp.

#### Criterii de Acceptare

1. WHEN o tranzacție de tip `expense` este creată sau actualizată, THE Notification_Service SHALL verifica dacă suma cheltuielilor din categoria tranzacției depășește 80% din limita `BudgetCategory.limitAmount` pentru luna curentă și, dacă da, SHALL crea o notificare de tip `budget_near_limit` cu titlul „Buget aproape de limită" dacă nu există deja o notificare necitită de același tip pentru aceeași categorie și lună.

2. WHEN o tranzacție de tip `expense` este creată sau actualizată, THE Notification_Service SHALL verifica dacă suma cheltuielilor din categoria tranzacției depășește 100% din `BudgetCategory.limitAmount` pentru luna curentă și, dacă da, SHALL crea o notificare de tip `budget_exceeded` cu titlul „Limită buget depășită" dacă nu există deja o notificare necitită de același tip pentru aceeași categorie și lună.

3. WHEN un utilizator autentificat trimite `GET /api/notifications`, THE Notification_Service SHALL returna lista notificărilor utilizatorului, ordonate descrescător după `createdAt`, cu câmpurile: `id`, `type`, `title`, `message`, `isRead`, `relatedEntityId`, `createdAt`.

4. WHEN un utilizator autentificat trimite `PATCH /api/notifications/:id/read`, THE Notification_Service SHALL seta câmpul `isRead` la `true` pentru notificarea cu id-ul specificat și SHALL returna notificarea actualizată.

5. WHEN un utilizator autentificat trimite `PATCH /api/notifications/read-all`, THE Notification_Service SHALL seta `isRead` la `true` pentru toate notificările necitite ale utilizatorului și SHALL returna numărul de notificări actualizate.

6. IF notificarea cu id-ul specificat nu aparține utilizatorului autentificat, THEN THE Notification_Service SHALL returna HTTP 404.

7. THE Notification_Service SHALL expune un endpoint `GET /api/notifications/unread-count` care returnează `{ count: number }` cu numărul de notificări necitite ale utilizatorului autentificat.

---

### Cerința 4: Frontend — Înregistrarea rutelor în app.ts și servicii API

**User Story:** Ca dezvoltator, vreau ca modulele Statistics, Reports și Notifications să fie înregistrate în aplicația Express și ca Frontend-ul să aibă servicii API dedicate pentru fiecare resursă, astfel încât paginile să poată consuma date reale.

#### Criterii de Acceptare

1. THE Backend SHALL înregistra rutele `/api/statistics`, `/api/reports` și `/api/notifications` în `backend/src/app.ts`, la fel cum sunt înregistrate rutele existente pentru auth, users, categories, transactions și budgets.

2. THE Frontend SHALL conține fișierul `frontend/src/services/transactions.service.ts` care exportă funcțiile: `getTransactions(filters?)`, `createTransaction(data)`, `updateTransaction(id, data)` și `deleteTransaction(id)`, fiecare utilizând instanța `api` din `frontend/src/services/api.ts`.

3. THE Frontend SHALL conține fișierul `frontend/src/services/categories.service.ts` care exportă funcțiile: `getCategories()`, `createCategory(data)`, `updateCategory(id, data)` și `deleteCategory(id)`.

4. THE Frontend SHALL conține fișierul `frontend/src/services/budgets.service.ts` care exportă funcțiile: `getBudgets()`, `createBudget(data)`, `updateBudget(id, data)` și `deleteBudget(id)`.

5. THE Frontend SHALL conține fișierul `frontend/src/services/statistics.service.ts` care exportă funcțiile: `getOverview(params?)`, `getByCategory(params?)` și `getMonthlyTrend(params?)`.

6. THE Frontend SHALL conține fișierul `frontend/src/services/notifications.service.ts` care exportă funcțiile: `getNotifications()`, `getUnreadCount()`, `markAsRead(id)` și `markAllAsRead()`.

7. WHEN un serviciu API primește un răspuns HTTP 401, THE API_Client SHALL apela automat `POST /api/auth/refresh` pentru a reînnoi token-ul și SHALL reîncerca request-ul original, conform interceptorului existent în `frontend/src/services/api.ts`.

---

### Cerința 5: Frontend — Layout complet cu Sidebar și Header

**User Story:** Ca utilizator web, vreau un layout consistent cu sidebar de navigare și header cu notificări, astfel încât să navighez ușor între secțiunile aplicației.

#### Criterii de Acceptare

1. THE Frontend SHALL înlocui Navbar-ul orizontal existent cu un Sidebar vertical care conține link-uri de navigare către: Dashboard (`/`), Tranzacții (`/transactions`), Bugete (`/budgets`), Categorii (`/categories`), Rapoarte (`/reports`) și Setări (`/settings`), fiecare cu iconița corespunzătoare din `lucide-react`.

2. THE Frontend SHALL afișa un Header în partea superioară a conținutului principal, conținând: titlul paginii curente, componenta Notification_Bell cu numărul de notificări necitite și numele utilizatorului autentificat.

3. WHEN utilizatorul face click pe Notification_Bell, THE Frontend SHALL afișa un dropdown cu ultimele 5 notificări necitite, fiecare cu titlul, mesajul și data relativă (ex: „acum 2 ore").

4. WHEN utilizatorul face click pe o notificare din dropdown, THE Frontend SHALL marca notificarea ca citită prin `PATCH /api/notifications/:id/read` și SHALL naviga la pagina relevantă (ex: `/budgets` pentru notificări de tip `budget_exceeded`).

5. THE Sidebar SHALL evidenția vizual link-ul activ corespunzător rutei curente, folosind clasa CSS `active` sau stilizare inline.

6. WHILE utilizatorul este autentificat, THE Layout SHALL afișa Sidebar-ul și Header-ul pe toate paginile protejate (Dashboard, Transactions, Budgets, Categories, Reports, Settings).

---

### Cerința 6: Frontend — Conectarea Dashboard și Transactions la API real

**User Story:** Ca utilizator, vreau ca Dashboard-ul și pagina Transactions să afișeze datele mele reale din baza de date, nu date mock hardcodate.

#### Criterii de Acceptare

1. WHEN pagina Dashboard se încarcă, THE Frontend SHALL apela `GET /api/statistics/overview` pentru luna curentă și SHALL afișa valorile reale pentru „Sold Curent", „Venituri (Luna aceasta)" și „Cheltuieli (Luna aceasta)" în locul valorilor hardcodate.

2. WHEN pagina Dashboard se încarcă, THE Frontend SHALL apela `GET /api/statistics/monthly-trend?months=7` și SHALL afișa datele reale în graficul „Evoluție Sold" (LineChart Recharts), înlocuind `mockChartData`.

3. WHEN pagina Dashboard se încarcă, THE Frontend SHALL apela `GET /api/transactions` cu limita de 5 tranzacții și SHALL afișa tranzacțiile reale în secțiunea „Ultimele Tranzacții", înlocuind `mockTransactions`.

4. WHEN pagina Transactions se încarcă, THE Frontend SHALL apela `GET /api/transactions` și SHALL afișa tranzacțiile reale în tabel, eliminând fallback-ul pe `MOCK_TRANSACTIONS`.

5. WHEN utilizatorul completează și trimite formularul „Adaugă Tranzacție" din pagina Transactions, THE Frontend SHALL apela `POST /api/transactions` cu datele formularului (descriere, sumă, tip `income`/`expense`, categorie, dată) și SHALL reîncărca lista de tranzacții după salvare cu succes.

6. THE Formularul de adăugare tranzacție SHALL conține câmpurile: Descriere (text), Sumă (număr pozitiv), Tip (select: Venit/Cheltuială), Categorie (select populat din `GET /api/categories`), Data (date picker).

7. IF apelul API eșuează la încărcarea paginii, THE Frontend SHALL afișa un mesaj de eroare vizibil utilizatorului (ex: „Nu s-au putut încărca datele. Încearcă din nou."), fără a afișa date mock.

8. THE Frontend SHALL folosi TanStack_Query (`useQuery`, `useMutation`) pentru toate apelurile API din Dashboard și Transactions, asigurând cache, loading states și error states.

---

### Cerința 7: Frontend — Pagina Budgets completă

**User Story:** Ca utilizator, vreau să gestionez bugete lunare cu limite pe categorii și să văd progresul cheltuielilor față de limite, astfel încât să îmi controlez cheltuielile.

#### Criterii de Acceptare

1. WHEN pagina Budgets se încarcă, THE Frontend SHALL apela `GET /api/budgets` și SHALL afișa lista bugetelor existente, fiecare cu luna/anul, limita totală și un Budget_Progress vizual (bară de progres) care arată procentul cheltuielilor față de limita totală.

2. WHEN utilizatorul face click pe „Creează Buget", THE Frontend SHALL afișa un modal cu formularul: Luna (select 1-12), Anul (număr), Limita Totală (număr), și cel puțin o categorie cu limita ei (posibilitate de a adăuga mai multe categorii).

3. WHEN utilizatorul trimite formularul de creare buget, THE Frontend SHALL apela `POST /api/budgets` și SHALL reîncărca lista după succes.

4. WHEN utilizatorul face click pe „Editează" pentru un buget existent, THE Frontend SHALL afișa modalul pre-populat cu datele bugetului și SHALL apela `PATCH /api/budgets/:id` la trimitere.

5. WHEN utilizatorul face click pe „Șterge" pentru un buget, THE Frontend SHALL afișa o confirmare și SHALL apela `DELETE /api/budgets/:id` după confirmare.

6. THE Budget_Progress SHALL afișa bara de progres în culoarea verde când cheltuielile sunt sub 80% din limită, galben între 80% și 100%, și roșu când depășesc 100%.

7. THE Frontend SHALL folosi TanStack_Query pentru toate operațiunile CRUD pe bugete.

---

### Cerința 8: Frontend — Pagina Categories

**User Story:** Ca utilizator, vreau să gestionez categoriile personalizate de venituri și cheltuieli, astfel încât să pot organiza tranzacțiile conform nevoilor mele.

#### Criterii de Acceptare

1. WHEN pagina Categories se încarcă, THE Frontend SHALL apela `GET /api/categories` și SHALL afișa categoriile grupate în două secțiuni: „Categorii Implicite" (cele cu `isDefault: true`) și „Categoriile Mele" (cele create de utilizator).

2. WHEN utilizatorul face click pe „Adaugă Categorie", THE Frontend SHALL afișa un modal cu formularul: Nume (text, minim 2 caractere), Tip (select: Venit/Cheltuială), Culoare (color picker sau input hex), Iconiță (text opțional).

3. WHEN utilizatorul trimite formularul de creare categorie, THE Frontend SHALL apela `POST /api/categories` și SHALL reîncărca lista.

4. WHEN utilizatorul face click pe „Editează" pentru o categorie personalizată, THE Frontend SHALL afișa modalul pre-populat și SHALL apela `PATCH /api/categories/:id` la trimitere.

5. WHEN utilizatorul face click pe „Șterge" pentru o categorie personalizată, THE Frontend SHALL afișa o confirmare și SHALL apela `DELETE /api/categories/:id`.

6. IF utilizatorul încearcă să editeze sau să șteargă o categorie implicită (`isDefault: true`), THE Frontend SHALL dezactiva butoanele de editare/ștergere pentru acele categorii.

---

### Cerința 9: Frontend — Pagina Reports

**User Story:** Ca utilizator, vreau să vizualizez rapoarte financiare detaliate cu grafice și să export datele în PDF sau Excel.

#### Criterii de Acceptare

1. WHEN pagina Reports se încarcă, THE Frontend SHALL apela `GET /api/statistics/by-category` și SHALL afișa un grafic de tip PieChart (Recharts) cu distribuția cheltuielilor pe categorii pentru luna curentă.

2. WHEN pagina Reports se încarcă, THE Frontend SHALL apela `GET /api/statistics/monthly-trend?months=12` și SHALL afișa un grafic BarChart (Recharts) cu veniturile și cheltuielile lunare pe ultimele 12 luni.

3. WHEN utilizatorul face click pe butonul „Export PDF", THE Frontend SHALL apela `GET /api/reports/export/pdf` cu perioada selectată și SHALL declanșa descărcarea automată a fișierului PDF în browser.

4. WHEN utilizatorul face click pe butonul „Export Excel", THE Frontend SHALL apela `GET /api/reports/export/excel` cu perioada selectată și SHALL declanșa descărcarea automată a fișierului Excel în browser.

5. THE Pagina Reports SHALL conține un selector de perioadă (lună de start și lună de sfârșit) care filtrează toate graficele și exporturile.

---

### Cerința 10: Frontend — Pagina Settings

**User Story:** Ca utilizator, vreau să îmi gestionez profilul și preferințele contului, astfel încât să personalizez experiența în aplicație.

#### Criterii de Acceptare

1. WHEN pagina Settings se încarcă, THE Frontend SHALL apela `GET /api/users/me` și SHALL pre-popula formularul cu datele utilizatorului: Prenume, Nume, Email (read-only), Monedă preferată.

2. WHEN utilizatorul modifică datele profilului și face click pe „Salvează", THE Frontend SHALL apela `PATCH /api/users/me` cu datele actualizate și SHALL afișa un mesaj de succes.

3. THE Pagina Settings SHALL conține o secțiune separată „Schimbă Parola" cu câmpurile: Parola Curentă, Parola Nouă (minim 6 caractere), Confirmă Parola Nouă.

4. WHEN utilizatorul completează și trimite formularul de schimbare parolă, THE Frontend SHALL apela `PATCH /api/users/me/password` și SHALL afișa mesaj de succes sau eroare.

5. IF câmpul „Confirmă Parola Nouă" nu coincide cu „Parola Nouă", THE Frontend SHALL afișa eroarea de validare „Parolele nu coincid" fără a trimite request-ul API.

---

### Cerința 11: Mobile — Ecranul Transactions

**User Story:** Ca utilizator mobil, vreau să văd și să adaug tranzacții din aplicația mobilă, astfel încât să înregistrez cheltuielile și veniturile în timp real.

#### Criterii de Acceptare

1. WHEN ecranul Transactions se încarcă în Mobile_App, THE Mobile_App SHALL apela `GET /api/transactions` folosind API_Client-ul mobil și SHALL afișa lista tranzacțiilor în format FlatList, fiecare cu: data, descrierea, tipul (Venit/Cheltuială) și suma formatată cu moneda RON.

2. WHEN utilizatorul apasă butonul „+" din ecranul Transactions, THE Mobile_App SHALL afișa un modal sau un ecran nou cu formularul de adăugare tranzacție: Descriere, Sumă, Tip (Venit/Cheltuială), Categorie (picker populat din API), Data.

3. WHEN utilizatorul trimite formularul de adăugare tranzacție, THE Mobile_App SHALL apela `POST /api/transactions` și SHALL reîncărca lista după succes.

4. IF apelul API eșuează, THE Mobile_App SHALL afișa un `Alert` nativ cu mesajul de eroare.

5. THE Mobile_App SHALL afișa un indicator de loading (`ActivityIndicator`) în timp ce datele se încarcă.

---

### Cerința 12: Mobile — Ecranul Budgets

**User Story:** Ca utilizator mobil, vreau să văd bugetele lunare și progresul cheltuielilor, astfel încât să monitorizez situația financiară din telefon.

#### Criterii de Acceptare

1. WHEN ecranul Budgets se încarcă în Mobile_App, THE Mobile_App SHALL apela `GET /api/budgets` și SHALL afișa lista bugetelor în format FlatList, fiecare cu: luna/anul, limita totală și o bară de progres vizuală.

2. THE Bara de progres din Mobile_App SHALL afișa culoarea verde când cheltuielile sunt sub 80% din limită, galben între 80% și 100%, și roșu când depășesc 100%.

3. IF nu există bugete configurate, THE Mobile_App SHALL afișa mesajul „Nu ai configurat niciun buget. Accesează aplicația web pentru a crea bugete."

---

### Cerința 13: Mobile — Ecranul Settings

**User Story:** Ca utilizator mobil, vreau să îmi văd profilul și să mă pot deconecta din aplicația mobilă.

#### Criterii de Acceptare

1. WHEN ecranul Settings se încarcă în Mobile_App, THE Mobile_App SHALL apela `GET /api/users/me` și SHALL afișa: prenumele, numele, email-ul și moneda preferată a utilizatorului autentificat.

2. WHEN utilizatorul apasă butonul „Deconectare", THE Mobile_App SHALL apela `POST /api/auth/logout`, SHALL șterge token-ul din AsyncStorage prin `useAuthStore.logout()` și SHALL naviga la ecranul de Login.

3. IF apelul de logout eșuează, THE Mobile_App SHALL executa oricum `useAuthStore.logout()` și SHALL naviga la Login, pentru a nu bloca utilizatorul în aplicație.

---

### Cerința 14: Mobile — Navigare completă cu Bottom Tab Navigator

**User Story:** Ca utilizator mobil, vreau să navighez între secțiunile aplicației prin tab-uri în partea de jos a ecranului, conform pattern-ului standard mobile.

#### Criterii de Acceptare

1. THE Mobile_App SHALL înlocui `createNativeStackNavigator` cu o structură de navigare care include un `createBottomTabNavigator` cu tab-urile: Dashboard, Tranzacții, Bugete și Setări, fiecare cu iconița corespunzătoare din `@expo/vector-icons` sau `lucide-react-native`.

2. WHILE utilizatorul este autentificat, THE Mobile_App SHALL afișa Bottom Tab Navigator-ul pe toate ecranele principale.

3. WHEN utilizatorul nu este autentificat, THE Mobile_App SHALL afișa exclusiv ecranul de Login, fără tab-uri.

---

### Cerința 15: Deploy — Backend pe Railway

**User Story:** Ca echipă de dezvoltare, vreau să deploy-ez backend-ul și baza de date PostgreSQL pe Railway, astfel încât aplicația să fie accesibilă public.

#### Criterii de Acceptare

1. THE Backend SHALL fi configurat cu un fișier `railway.json` sau `Procfile` care specifică comanda de start `node dist/server.js` și comanda de build `npm run build`.

2. THE Backend SHALL citi variabilele de mediu (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `NODE_ENV`) exclusiv din environment variables Railway, fără valori hardcodate.

3. WHEN Railway deploy-ează backend-ul, THE Backend SHALL executa automat `prisma migrate deploy` înainte de pornirea serverului, pentru a aplica migrările pe baza de date de producție.

4. THE Backend SHALL actualiza configurația CORS din `backend/src/app.ts` pentru a include URL-ul de producție al Frontend-ului Vercel în lista de origini permise.

5. WHEN backend-ul este deploy-at, THE Backend SHALL răspunde cu HTTP 200 la `GET /api/health`, confirmând că serverul rulează corect.

---

### Cerința 16: Deploy — Frontend pe Vercel

**User Story:** Ca echipă de dezvoltare, vreau să deploy-ez frontend-ul React pe Vercel, astfel încât utilizatorii să acceseze aplicația web printr-un URL public.

#### Criterii de Acceptare

1. THE Frontend SHALL fi configurat cu un fișier `vercel.json` care specifică: comanda de build `npm run build`, directorul de output `dist` și o regulă de rewrite `{ "source": "/(.*)", "destination": "/index.html" }` pentru a suporta React Router.

2. THE Frontend SHALL citi URL-ul backend-ului din variabila de mediu `VITE_API_URL` (configurată în Vercel Dashboard), înlocuind `baseURL: '/api'` din `frontend/src/services/api.ts` cu `baseURL: import.meta.env.VITE_API_URL`.

3. WHEN Vercel deploy-ează frontend-ul, THE Frontend SHALL construi cu succes (`npm run build`) fără erori TypeScript sau de compilare.

4. WHEN un utilizator accesează direct o rută internă (ex: `/transactions`), THE Frontend SHALL afișa pagina corectă, nu o eroare 404, datorită regulii de rewrite din `vercel.json`.
