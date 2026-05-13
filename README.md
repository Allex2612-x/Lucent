# Sasha - Personal Finance Management Application

## 📋 Despre Proiect

**Sasha** este o aplicație web modernă de management financiar personal, dezvoltată ca proiect de licență. Aplicația permite utilizatorilor să își gestioneze veniturile și cheltuielile, să stabilească bugete, să primească notificări automate și să genereze rapoarte financiare detaliate.

### 🎯 Scopul Proiectului

Aplicația are ca scop principal oferirea unei soluții complete și intuitive pentru:
- **Monitorizarea tranzacțiilor** - Înregistrarea și urmărirea tuturor veniturilor și cheltuielilor
- **Gestionarea bugetelor** - Stabilirea de limite de cheltuieli pe categorii și monitorizarea progresului
- **Tranzacții recurente** - Automatizarea înregistrării cheltuielilor și veniturilor repetitive
- **Notificări inteligente** - Alertare automată când bugetele sunt aproape de limită sau depășite
- **Rapoarte și statistici** - Vizualizarea clară a situației financiare prin grafice și rapoarte exportabile
- **Organizare pe categorii** - Clasificarea tranzacțiilor pentru o mai bună înțelegere a cheltuielilor

---

## 🏗️ Arhitectură Tehnică

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand (auth state) + TanStack Query (server state)
- **UI Components**: Custom components cu Lucide React icons
- **Charts**: Recharts pentru vizualizări grafice
- **Styling**: CSS custom cu design tokens și variabile CSS
- **Date Handling**: date-fns
- **Notifications**: Sonner (toast notifications)
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens) + bcrypt
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting
- **File Generation**: PDFKit (rapoarte PDF), ExcelJS (rapoarte Excel)
- **Testing**: Vitest

### Database Schema
- **Users** - Informații utilizatori și setări
- **Categories** - Categorii de venituri/cheltuieli (default + personalizate)
- **Transactions** - Tranzacții cu suport pentru recurență
- **Budgets** - Bugete lunare (total sau pe categorii)
- **BudgetCategories** - Limite de buget pe categorii
- **Notifications** - Notificări pentru utilizatori

---

## 📱 Pagini și Funcționalități

### 1. **Autentificare** (`/login`, `/register`)
- **Login**: Autentificare cu email și parolă
- **Register**: Înregistrare utilizatori noi cu validare
- **Securitate**: JWT tokens, cookie-based authentication

### 2. **Dashboard** (`/dashboard`)
- **Rezumat financiar**: Venituri totale, cheltuieli totale, sold curent
- **Grafice interactive**:
  - Evoluția veniturilor și cheltuielilor în timp (line chart)
  - Distribuția cheltuielilor pe categorii (pie chart)
  - Comparație venituri vs cheltuieli (bar chart)
- **Tranzacții recente**: Lista ultimelor 5 tranzacții
- **Filtrare pe perioadă**: Ultimele 7 zile, 30 zile, 90 zile, an curent
- **Indicatori vizuali**: Culori diferite pentru venituri (teal) și cheltuieli (roșu)

### 3. **Tranzacții** (`/transactions`)
- **Lista completă**: Toate tranzacțiile cu paginare și sortare
- **Filtrare avansată**:
  - După tip (venituri/cheltuieli)
  - După categorie
  - După perioadă de timp
- **Adăugare tranzacții**:
  - Tranzacții simple (one-time)
  - Tranzacții recurente (zilnic, săptămânal, lunar, anual)
  - Validare date viitoare (blocate pentru tranzacții simple)
  - Integrare cu validarea bugetului
- **Editare și ștergere**:
  - Editare tranzacții existente
  - Ștergere cu confirmare
  - Opțiuni speciale pentru tranzacții recurente (șterge doar aceasta / șterge toate viitoare)
- **Indicatori vizuali**:
  - Icon Electric Blue Repeat pentru tranzacții recurente
  - Tooltip cu detalii despre recurență
  - Badge-uri pentru categorii

### 4. **Categorii** (`/categories`)
- **Categorii predefinite**: Set de categorii default pentru toți utilizatorii
- **Categorii personalizate**: Creare categorii proprii
- **Organizare pe tip**: Separare venituri vs cheltuieli
- **Personalizare**:
  - Nume categorie
  - Culoare (pentru vizualizări)
  - Icon emoji (stocat în DB, nu afișat în UI)
- **Operații CRUD**: Creare, editare, ștergere categorii personalizate

### 5. **Bugete** (`/budgets`)
- **Tipuri de bugete**:
  - Buget total lunar (limită globală de cheltuieli)
  - Bugete pe categorii (limite individuale)
- **Monitorizare progres**:
  - Bare de progres vizuale
  - Procent utilizat din buget
  - Suma cheltuită vs limită
- **Alerte vizuale**:
  - Verde: sub 80% din limită
  - Galben: 80-99% din limită
  - Roșu: peste 100% (depășit)
- **Validare la adăugare tranzacție**:
  - Pop-up de avertizare când se depășește bugetul
  - Opțiune de continuare sau anulare
  - Afișare detalii: categorie, sumă curentă, limită, depășire
- **Gestionare**:
  - Creare bugete noi pentru luni viitoare
  - Editare limite existente
  - Ștergere bugete

### 6. **Rapoarte** (`/reports`)
- **Tipuri de rapoarte**:
  - Raport de venituri
  - Raport de cheltuieli
  - Raport complet (venituri + cheltuieli)
- **Filtrare**:
  - Perioadă personalizată (de la - până la)
  - Filtrare pe categorii specifice
- **Vizualizare**:
  - Tabel detaliat cu toate tranzacțiile
  - Subtotaluri pe categorii
  - Total general
- **Export**:
  - Format PDF (document formatat profesional)
  - Format Excel (pentru analiză în Excel/Sheets)
- **Statistici incluse**:
  - Număr total tranzacții
  - Suma totală pe tip
  - Breakdown pe categorii

### 7. **Setări** (`/settings`)
- **Profil utilizator**:
  - Nume (prenume + nume)
  - Email
  - Monedă preferată (RON default)
- **Securitate**:
  - Schimbare parolă
  - Validare parolă curentă
- **Preferințe**:
  - Setări de afișare
  - Configurări notificări

### 8. **Notificări** (Dropdown în Header)
- **Tipuri de notificări**:
  - **Budget Exceeded**: Când cheltuielile depășesc 100% din limita bugetului
  - **Budget Near Limit**: Când cheltuielile ajung la 80-99% din limită
- **Funcționalități**:
  - Badge cu număr notificări necitite
  - Dropdown cu ultimele 5 notificări
  - Marcare ca citită la click
  - Navigare automată la pagina relevantă (ex: Budgets)
  - Timestamp relativ (ex: "acum 2 ore")
- **Actualizare automată**: Polling la fiecare 30 secunde

---

## 🎨 Design System

### Paleta de Culori (Electric Blue Theme)
- **Primary Accent**: Electric Blue (#3B82F6) - butoane, link-uri, elemente active
- **Success (Venituri)**: Teal (#00D9C0) - indicatori venituri, grafice
- **Danger (Cheltuieli)**: Red (#FF5A6B) - indicatori cheltuieli, butoane delete
- **Warning**: Amber (#F59E0B) - alerte buget aproape de limită
- **Background**: Dark theme cu nuanțe de gri
- **Text**: Ierarhie clară (primary, secondary, tertiary)

### Componente UI
- **Buttons**: Primary, Secondary, Ghost, Danger
- **Cards**: Container-uri cu shadow și border radius
- **Modals**: Overlay + centered content cu animații
- **Forms**: Input, Select, Textarea cu validare
- **Tables**: Responsive cu hover states
- **Charts**: Recharts cu culori din design system
- **Toast Notifications**: Sonner cu z-index 9999
- **Empty States**: Ilustrații și mesaje pentru liste goale

### Layout
- **Sidebar Navigation**: Fix pe stânga, 240px width
- **Header**: Sticky top, notificări + user info + logout
- **Main Content**: Responsive, max-width pentru lizibilitate
- **Page Structure**: Title + description + action button (right-aligned)

### Responsive Design
- **Mobile**: 1 coloană, sidebar collapsible
- **Tablet**: 2 coloane pentru grid-uri
- **Desktop**: 3 coloane, layout complet

---

## 🔐 Securitate

- **Authentication**: JWT tokens cu expirare
- **Password Hashing**: bcrypt cu salt
- **Rate Limiting**: Protecție împotriva brute force
- **CORS**: Configurare strictă pentru API
- **Helmet**: Security headers
- **Input Validation**: Zod schemas pe backend
- **SQL Injection Protection**: Prisma ORM cu prepared statements
- **XSS Protection**: Sanitizare input-uri

---

## 🚀 Funcționalități Avansate

### Tranzacții Recurente
- **Frecvențe suportate**: Zilnic, Săptămânal, Lunar, Anual
- **Repetări**: 1-365 repetări (nu infinit)
- **Generare automată**: Toate instanțele se creează la salvare
- **Grupare**: recurringGroupId pentru identificare
- **Ștergere inteligentă**: Opțiune de ștergere single vs all future
- **Validare date**: Permite date viitoare doar pentru recurente

### Validare Bugete
- **Verificare în timp real**: La adăugare/editare tranzacție
- **Modal de avertizare**: Pop-up cu detalii despre depășire
- **Opțiune de continuare**: Utilizatorul decide dacă procedează
- **Calcul dinamic**: Include toate tranzacțiile din luna curentă
- **Notificări automate**: Creare notificări la 80% și 100%

### Sistem de Notificări
- **Idempotență**: Nu creează duplicate pentru notificări necitite
- **Trigger automat**: La fiecare tranzacție de tip expense
- **Persistență**: Stocate în baza de date
- **Polling**: Actualizare automată la 30s
- **Interactivitate**: Click pentru navigare și marcare ca citită

---

## 📊 Raportare și Analiză

### Grafice Dashboard
1. **Line Chart**: Evoluție venituri/cheltuieli în timp
2. **Pie Chart**: Distribuție cheltuieli pe categorii (cu cache pentru performanță)
3. **Bar Chart**: Comparație lunară venituri vs cheltuieli

### Export Rapoarte
- **PDF**: Document profesional cu logo, header, footer, tabele formatate
- **Excel**: Spreadsheet cu formule, formatare, multiple sheets
- **Filtrare**: Perioadă personalizată + categorii specifice
- **Conținut**: Tranzacții detaliate + statistici + subtotaluri

---

## 🗄️ Structura Bazei de Date

### Relații Principale
- **User** → **Transactions** (one-to-many)
- **User** → **Categories** (one-to-many, custom categories)
- **User** → **Budgets** (one-to-many)
- **User** → **Notifications** (one-to-many)
- **Category** → **Transactions** (one-to-many)
- **Budget** → **BudgetCategories** (one-to-many)
- **Category** → **BudgetCategories** (one-to-many)

### Indexuri pentru Performanță
- `Transaction`: index pe `[userId, recurringGroupId]`
- `Transaction`: index pe `[userId, date]`
- `Budget`: unique constraint pe `[userId, month, year, isTotal]`
- `BudgetCategory`: unique constraint pe `[budgetId, categoryId]`

---

## 🛠️ Dezvoltare și Testing

### Backend Testing
- **Framework**: Vitest
- **Coverage**: Unit tests pentru servicii critice
- **Teste incluse**:
  - Date validation (DateValidator)
  - Budget validation (BudgetValidator)
  - Recurring transaction engine
  - Schema verification

### Frontend Development
- **Hot Module Replacement**: Vite HMR pentru development rapid
- **Type Safety**: TypeScript strict mode
- **Code Quality**: ESLint pentru backend
- **API Integration**: Axios cu interceptors pentru auth

---

## 📦 Instalare și Rulare

### Cerințe
- Node.js 18+
- PostgreSQL 14+
- npm sau yarn

### Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurează DATABASE_URL în .env
npm run prisma:migrate
npm run dev
```

### Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
```
Database: sasha_licenta_dev
User: myuser
Password: 1234
Port: 5432
```

---

## 🎯 Cazuri de Utilizare Principale

1. **Utilizator nou**:
   - Se înregistrează → Primește categorii default → Adaugă prima tranzacție → Setează bugete

2. **Gestionare cheltuieli lunare**:
   - Setează bugete la început de lună → Adaugă tranzacții pe parcurs → Primește notificări când se apropie de limită → Vizualizează rapoarte la final de lună

3. **Tranzacții recurente**:
   - Adaugă chirie (lunar, 12 luni) → Sistemul creează automat toate cele 12 instanțe → Poate șterge individual sau toate viitoare

4. **Analiză financiară**:
   - Accesează Dashboard → Vizualizează grafice → Filtrează pe perioadă → Exportă raport PDF/Excel pentru arhivare

---

## 🌟 Caracteristici Distinctive

- ✅ **Interfață modernă** cu dark theme și Electric Blue accent
- ✅ **Tranzacții recurente** cu gestionare inteligentă
- ✅ **Validare bugete în timp real** cu modal de avertizare
- ✅ **Notificări automate** pentru depășiri buget
- ✅ **Export rapoarte** în PDF și Excel
- ✅ **Grafice interactive** pentru vizualizare date
- ✅ **Responsive design** pentru toate device-urile
- ✅ **Type-safe** cu TypeScript pe frontend și backend
- ✅ **Securitate robustă** cu JWT și rate limiting
- ✅ **Performanță optimizată** cu indexuri DB și caching

---

## 📝 Limbaj și Localizare

- **Interfață**: Română (toate mesajele, labels, notificări)
- **Monedă**: RON (Lei românești) - default, configurabil
- **Format date**: dd/MM/yyyy
- **Format timp**: Relativ (ex: "acum 2 ore", "ieri")

---

## 🔮 Dezvoltări Viitoare (Opțional)

- OCR pentru scanare bonuri fiscale
- Integrări bancare pentru import automat tranzacții
- Aplicație mobilă (React Native)
- Partajare bugete între utilizatori (familie)
- Obiective financiare (savings goals)
- Predicții AI pentru cheltuieli viitoare
- Multi-currency support
- Dark/Light theme toggle

---

## 👨‍💻 Autor

Proiect de licență dezvoltat de **Sasha** (Alexandru)

**Stack**: React + TypeScript + Node.js + Express + PostgreSQL + Prisma

**Anul**: 2024-2025
