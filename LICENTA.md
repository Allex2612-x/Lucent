> **NOTĂ DE LUCRU:** Acest fișier este lucrarea de licență FARO, scrisă după modelul tezei Giuliei Barbu (SmartEDU). Capitolele 1-3 sunt complete. Capitolele 4-7 vor fi adăugate ulterior. Inserează diagramele (Fig 1-18) la locurile marcate `[Insert Figura N]` când publici în Word.

---

# FARO — Platformă web pentru gestiunea finanțelor personale

**Proiect de diplomă**

Absolvent: [Numele tău]
Conducător științific: [Numele coordonatorului]

Timișoara, 2026

---

## CUPRINS

- [CAPITOLUL 1 - INTRODUCERE](#capitolul-1---introducere)
  - 1.1 Context general
  - 1.2 Tema proiectului
  - 1.3 Structura pe capitole
- [CAPITOLUL 2 - FUNDAMENTAREA TEORETICĂ](#capitolul-2---fundamentarea-teoretică)
  - 2.1 React și ecosistemul SPA
  - 2.2 TypeScript
  - 2.3 Vite — bundler și dev server
  - 2.4 Node.js și Express
  - 2.5 Prisma ORM
  - 2.6 PostgreSQL
  - 2.7 REST API
  - 2.8 JSON Web Tokens (JWT)
  - 2.9 Google Gemini — multimodal AI
  - 2.10 Resend — email transactional
  - 2.11 Railway — platformă de deploy
- [CAPITOLUL 3 - DESCRIEREA GENERALĂ A PROIECTULUI](#capitolul-3---descrierea-generală-a-proiectului)
  - 3.1 Prezentarea sumară a aplicației. Schema bloc
  - 3.2 Funcționalitățile aplicației
  - 3.3 Planificarea lucrărilor
    - 3.3.1 Ciclul de viață V
    - 3.3.2 Diagrama Gantt

---

# CAPITOLUL 1 - INTRODUCERE

## 1.1 Context general

Gestionarea responsabilă a finanțelor personale a devenit, în ultimul deceniu, o componentă esențială a vieții moderne. Pe măsură ce numărul cardurilor bancare, al abonamentelor recurente și al achizițiilor online a crescut, capacitatea unei persoane de a urmări manual unde se duc banii s-a redus semnificativ. Studiile arată că majoritatea utilizatorilor nu pot estima corect, fără un instrument software, ce procent din venitul lunar îl alocă unei categorii de cheltuieli — fie ea mâncare, transport sau servicii. În același timp, costul vieții și instabilitatea economică impun o disciplină financiară mai riguroasă decât simpla consultare periodică a soldului bancar.

Aplicațiile mobile și web dedicate finanțelor personale au apărut ca răspuns la această nevoie. Ele oferă utilizatorului o imagine consolidată a tuturor veniturilor și cheltuielilor, posibilitatea de a stabili bugete pe categorii, rapoarte vizuale care evidențiază tendințele lunare și alerte care îl atenționează când o categorie e pe punctul de a fi depășită. Astfel de aplicații nu înlocuiesc consultanța financiară profesională, dar acoperă un gol important: oferă utilizatorului obișnuit instrumentele necesare pentru a-și înțelege propriul comportament financiar și pentru a lua decizii informate.

În contextul tehnologiei moderne, dezvoltarea unei aplicații de finanțe personale presupune mai multe provocări tehnice non-triviale. În primul rând, introducerea tranzacțiilor trebuie să fie cât mai facilă, ceea ce înseamnă reducerea numărului de pași necesari pentru a adăuga o cheltuială. În al doilea rând, datele financiare sunt sensibile și necesită mecanisme de securitate riguroase — hashing al parolelor, token-uri cu expirare scurtă, comunicare cifrată. În al treilea rând, vizualizarea trebuie să fie clară pe orice dispozitiv, de la monitor desktop la telefonul mobil. În al patrulea rând, integrarea cu servicii moderne precum modelele de inteligență artificială permite automatizarea unor sarcini repetitive precum încadrarea automată a tranzacțiilor în categorii sau extragerea datelor din bonurile fiscale.

Tehnologia web modernă oferă astăzi un ecosistem matur pentru construirea unor astfel de aplicații. Framework-urile front-end precum React permit construirea de interfețe interactive complexe folosind o arhitectură bazată pe componente reutilizabile. Pe partea de back-end, Node.js cu Express oferă un model de dezvoltare ușor de înțeles și rapid, iar bazele de date relaționale precum PostgreSQL asigură integritatea datelor printr-un sistem de constrângeri și relații strict definite. Aceste tehnologii, combinate cu servicii moderne de inteligență artificială precum Google Gemini, permit dezvoltarea unei aplicații complete în câteva luni de muncă individuală.

## 1.2 Tema proiectului

Aplicația web FARO a fost dezvoltată ca răspuns la nevoia unor instrumente accesibile, intuitive și inteligente pentru gestionarea bugetului personal. Spre deosebire de aplicațiile clasice de buget, în care utilizatorul trebuie să introducă manual fiecare tranzacție, FARO integrează un model de inteligență artificială multimodal (Google Gemini) care permite scanarea unui bon fiscal — aplicația extrage automat magazinul, suma totală, data și lista de produse, transformând o operațiune care durează în mod normal câteva minute într-una de câteva secunde.

Aplicația acoperă întregul spectru de operațiuni necesare unui utilizator obișnuit:

- Înregistrarea tranzacțiilor (venituri și cheltuieli) cu posibilitatea de a le clasifica pe categorii;
- Crearea bugetelor lunare totale sau pe categorii, cu avertizare automată la apropierea sau depășirea limitei;
- Vizualizarea statisticilor lunare prin grafice (linie pentru evoluția în timp, donut pentru distribuția pe categorii);
- Generarea rapoartelor exportabile în format PDF sau Excel pentru o anumită perioadă;
- Detectarea automată a tranzacțiilor anormale prin analiză statistică (z-score);
- Recunoașterea optică a caracterelor (OCR) pentru bonuri fiscale, cu extragerea structurată a datelor;
- Sugerarea automată a categoriei pentru o tranzacție pe baza descrierii, folosind un model AI;
- Notificări in-app când un buget este depășit, cu posibilitatea de dezactivare individuală;
- Resetarea parolei prin email cu link securizat și token cu expirare;
- Autentificare cu cont propriu, precum și prin furnizori OAuth (Google, Facebook).

Aplicația dispune de o interfață web responsive care funcționează identic pe desktop și pe mobil, fără a necesita instalare locală. Utilizatorul accesează FARO direct dintr-un browser, după care își poate crea un cont, autentifica și folosi platforma de pe orice dispozitiv conectat la internet. Datele sunt sincronizate automat prin intermediul unei baze de date relaționale găzduite în cloud, ceea ce înseamnă că utilizatorul poate începe să adauge o tranzacție pe telefon și o poate finaliza pe laptop fără pierdere de informație.

Diferența majoră față de aplicațiile concurente este integrarea inteligenței artificiale într-un mod care reduce efectiv munca utilizatorului, nu doar adaugă funcționalități de marketing. Scanarea bonului, sugestia automată de categorie și generarea de sfaturi financiare săptămânale personalizate sunt toate construite în jurul aceluiași model multimodal, ceea ce permite o experiență consistentă și costuri operaționale reduse.

## 1.3 Structura pe capitole

Lucrarea este structurată în șapte capitole, conform următoarei organizări:

- **CAPITOLUL 1. INTRODUCERE.** Prezintă contextul general al aplicațiilor de finanțe personale, tema proiectului și organizarea pe capitole a lucrării.

- **CAPITOLUL 2. FUNDAMENTAREA TEORETICĂ.** Descrie tehnologiile, limbajele de programare și serviciile externe utilizate la construirea aplicației, oferind pentru fiecare o scurtă introducere și justificarea alegerii.

- **CAPITOLUL 3. DESCRIEREA GENERALĂ A PROIECTULUI.** Prezintă schema bloc a aplicației (Fig. 1), funcționalitățile principale grupate pe roluri și planificarea lucrărilor folosind modelul în V (Fig. 2) și diagrama Gantt (Fig. 3).

- **CAPITOLUL 4. PROIECTAREA ÎN DETALIU.** Conține considerațiile de implementare, schema tehnologiilor utilizate (Fig. 4), arhitectura pe cele șase module funcționale (Fig. 5.1-5.6), structura fișierelor (Fig. 6), schema completă a bazei de date (Fig. 7) cu structurile individuale ale tabelelor (Fig. 8.1-8.6) și descrierea detaliată a algoritmilor non-triviali (OCR, autentificare JWT, validare buget, detectare anomalii).

- **CAPITOLUL 5. UTILIZAREA APLICAȚIEI.** Prezintă interfețele aplicației pentru fiecare modul în parte, cu capturi de ecran și descrieri ale operațiunilor pe care utilizatorul le poate realiza.

- **CAPITOLUL 6. TESTAREA APLICAȚIEI.** Descrie obiectivele testării, funcțiile testate, mediul de testare cu cerințele hardware, metodologia urmată și raportul final cu rezultatele.

- **CAPITOLUL 7. CONCLUZII.** Sintetizează contribuțiile aplicației, evaluează gradul în care temele propuse au fost atinse și schițează direcțiile viitoare de dezvoltare.

---

# CAPITOLUL 2 - FUNDAMENTAREA TEORETICĂ

## 2.1 React și ecosistemul SPA

React este o bibliotecă open-source dezvoltată de Meta (Facebook) pentru construirea de interfețe utilizator interactive, bazată pe o arhitectură de componente reutilizabile. A fost lansată în 2013 și a devenit, în câțiva ani, cea mai populară soluție pentru dezvoltarea de aplicații web cu o singură pagină (Single Page Applications — SPA). Spre deosebire de modelul clasic în care fiecare navigare a utilizatorului declanșează o cerere completă către server și încărcarea unei pagini noi, în arhitectura SPA întreaga aplicație este încărcată o singură dată, iar navigările ulterioare modifică doar componentele afișate, fără reload complet.

Avantajele majore ale React-ului includ:

- **Componente reutilizabile** — codul interfeței este organizat în unități atomice (componente) care încapsulează logica, starea și prezentarea proprie. O componentă poate fi reutilizată în orice context fără modificări.
- **Virtual DOM** — React menține o reprezentare virtuală a structurii DOM și aplică modificările doar acolo unde e necesar, reducând semnificativ costul redimensionărilor.
- **Ecosistem matur** — există mii de biblioteci compatibile pentru routing, gestionarea stării, formulare, animații, internaționalizare etc.
- **JSX** — o sintaxă declarativă care permite scrierea structurii interfeței direct în cod JavaScript/TypeScript, facilitând citirea și menținerea aplicațiilor complexe.

În cadrul aplicației FARO am utilizat versiunea React 18.3, care introduce concurrent rendering — un mecanism prin care browser-ul poate întrerupe randările lente pentru a răspunde mai rapid input-urilor utilizatorului. Alături de React am folosit:

- **React Router 6.24** pentru rutare declarativă între pagini;
- **TanStack Query 5.51** pentru gestionarea stării provenite de la server (cache, refetch automat, invalidate selectiv);
- **Zustand 4.5** pentru starea client-side (utilizatorul autentificat, token-ul de acces);
- **Lucide React** pentru iconițele cu stil line.

## 2.2 TypeScript

TypeScript este un limbaj de programare open-source dezvoltat și menținut de Microsoft, care adaugă tiparea statică peste JavaScript. Codul scris în TypeScript este compilat (transpilat) în JavaScript standard, care poate fi apoi executat de orice motor JavaScript — fie el un browser modern, fie un runtime server precum Node.js.

Tiparea statică oferă avantaje semnificative pentru proiectele de dimensiuni medii și mari:

- Erorile cauzate de tipuri incompatibile sunt detectate în momentul compilării, nu la rulare;
- Editoarele de cod oferă autocomplete inteligent pentru proprietăți, metode și parametrii funcțiilor;
- Refactorizarea (redenumirea unui simbol, schimbarea semnăturii unei funcții) este sigură — compilatorul semnalează toate utilizările care trebuie actualizate;
- Tipurile servesc drept documentație internă, eliminând nevoia comentariilor care explică ce primește sau returnează o funcție.

În aplicația FARO am utilizat TypeScript 5.5 atât pe partea de front-end, cât și pe partea de back-end. Acest lucru permite definirea tipurilor partajate — interfețe care descriu forma datelor (de exemplu, ce câmpuri are o tranzacție sau un buget) — într-un format înțeles identic de ambele componente. Astfel, dacă schema bazei de date suferă o modificare, toate locurile din cod care depind de aceasta sunt actualizate sau semnalează erori la compilare.

## 2.3 Vite — bundler și dev server

Vite este un instrument modern de dezvoltare front-end, creat de Evan You (autorul Vue.js), care a câștigat o popularitate semnificativă datorită vitezei sale. Vite oferă două componente esențiale: un server de dezvoltare cu Hot Module Replacement (HMR) și un bundler de producție bazat pe Rollup.

Spre deosebire de bundler-ele clasice precum Webpack, care procesează întreaga aplicație înainte de a oferi un server local, Vite folosește modulele native ES (ES Modules) pe care browserele moderne le suportă direct. Acest lucru permite pornirea serverului de dezvoltare aproape instant, indiferent de mărimea proiectului, și actualizarea sub o secundă a modificărilor în browser.

Pentru build-ul de producție, Vite folosește Rollup — un bundler optimizat pentru output minimal. În cazul aplicației FARO, build-ul rezultat este de aproximativ 511 KB de JavaScript (148 KB după compresie gzip) și 32 KB de CSS — dimensiuni rezonabile pentru o aplicație web cu funcționalități multiple.

## 2.4 Node.js și Express

Node.js este un runtime JavaScript construit pe motorul V8 al browser-ului Chrome, care permite execuția codului JavaScript pe partea de server, în afara unui browser. Lansat în 2009 de Ryan Dahl, Node.js a revoluționat dezvoltarea de aplicații server prin modelul său non-blocking — un singur fir de execuție (single-threaded) procesează multiple cereri concurente prin intermediul unui event loop, ceea ce îl face deosebit de eficient pentru aplicații cu trafic mare și operațiuni I/O intensive.

Express este cel mai popular framework HTTP pentru Node.js. Oferă o sintaxă minimalistă pentru definirea rutelor (endpoint-uri HTTP), un sistem flexibil de middleware (funcții care procesează cererile în lanț) și o gamă largă de extensii pentru cazurile comune: parsarea cookie-urilor, gestionarea sesiunilor, validarea cererilor etc.

În cadrul aplicației FARO, Express este utilizat ca framework HTTP de bază pentru toate endpoint-urile REST. Modul de funcționare al API-ului REST este reprezentat în Fig. 11. Middleware-ele aplicate global la fiecare cerere includ:

- **helmet** — setează automat header-e HTTP de securitate (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security etc.);
- **cors** — controlează ce origini au voie să acceseze API-ul (whitelist explicit pentru frontend);
- **morgan** — logging-ul cererilor HTTP în terminal pe parcursul dezvoltării;
- **cookieParser** — parsează automat cookie-urile primite în header-ul Cookie;
- **passport** — middleware standardizat pentru autentificarea OAuth (Google, Facebook).

## 2.5 Prisma ORM

Prisma este un ORM (Object-Relational Mapper) modern pentru Node.js și TypeScript, construit în jurul ideii de schemă declarativă unică. Spre deosebire de ORM-urile clasice (TypeORM, Sequelize) care impun decoratori sau clase moștenite, Prisma definește schema într-un fișier separat (`schema.prisma`) cu o sintaxă proprie, din care generează automat un client TypeScript type-safe.

Beneficiile principale ale Prisma includ:

- **Tipare end-to-end** — fiecare query oferă autocomplete pentru câmpurile disponibile, iar rezultatul este tipat exact pe baza relațiilor incluse;
- **Query-uri parametrizate automat** — Prisma traduce orice apel JavaScript în SQL cu parametri pe canal separat, ceea ce elimină complet riscul de SQL injection;
- **Migrări versionate** — comanda `prisma migrate` generează fișiere SQL versionate pentru fiecare modificare a schemei;
- **Prisma Studio** — o interfață grafică de tip web pentru explorarea și editarea datelor în mod direct, utilă pentru debugging.

În aplicația FARO am utilizat Prisma 6.4 cu Postgres ca furnizor de bază de date. Schema completă este definită în `backend/prisma/schema.prisma` și include șase modele: User, Category, Transaction, Budget, BudgetCategory și Notification. Clientul Prisma generat este folosit în toate serviciile backend pentru orice operațiune cu baza de date.

## 2.6 PostgreSQL

PostgreSQL este un sistem de gestionare a bazelor de date relaționale (RDBMS) open-source, considerat unul dintre cele mai avansate sisteme de acest tip. Lansat inițial în 1996, PostgreSQL este recunoscut pentru conformitatea sa cu standardele SQL, suportul extensiv pentru tipurile de date complexe (JSON, JSONB, geospațiale, array-uri) și mecanismele riguroase de integritate a datelor.

Caracteristicile esențiale ale PostgreSQL pentru aplicațiile financiare includ:

- **Tranzacții ACID** — orice secvență de operațiuni grupată într-o tranzacție respectă proprietățile de Atomicitate, Consistență, Izolare și Durabilitate, ceea ce garantează că datele nu rămân niciodată într-o stare intermediară inconsistentă în caz de eroare;
- **Constrângeri de integritate** — chei primare, chei străine, unice, NOT NULL, CHECK — toate verificate la nivel de motor de bază de date, independent de codul aplicației;
- **Indexare avansată** — B-tree, Hash, GIN, GiST, BRIN — fiecare optimizat pentru un anumit tip de query;
- **Suport JSONB** — tipul JSONB permite stocarea documentelor JSON într-un format binar indexabil, oferind o abordare hibridă între relațional și document-oriented;
- **Concurență optimistă** — multiple cereri pot citi și modifica simultan baza de date fără blocaje explicite, prin mecanismul MVCC (Multi-Version Concurrency Control).

Pentru aplicația FARO, PostgreSQL versiunea 18 este utilizată ca singura bază de date a sistemului. Schema include șase tabele relaționate, plus o coloană JSONB (`Transaction.receiptData`) folosită pentru stocarea bonurilor digitale extrase prin OCR. Această abordare hibridă permite păstrarea integrității referențiale pentru entitățile esențiale (utilizatori, tranzacții, bugete) și flexibilitatea unui document JSON pentru date semi-structurate (liniile unui bon, care variază de la 1 la zeci de produse).

Alegerea unei baze de date relaționale, în loc de una NoSQL, a fost justificată de natura datelor financiare: relațiile dintre entități sunt strict definite (un utilizator are mai multe tranzacții, fiecare tranzacție aparține unei categorii, fiecare buget poate include mai multe categorii), iar query-urile agregate (suma cheltuielilor pe categorie, evoluția lunară a veniturilor) se exprimă natural în SQL prin GROUP BY și agregate native.

## 2.7 REST API

REST (Representational State Transfer) este un stil arhitectural pentru proiectarea serviciilor web, propus de Roy Fielding în 2000 și devenit standardul de facto pentru comunicarea client-server în era aplicațiilor web moderne. Un API REST expune resurse (entități de business) prin URL-uri unice, asupra cărora se aplică operațiuni standardizate prin verbele HTTP: GET pentru citire, POST pentru creare, PATCH pentru actualizare parțială, DELETE pentru ștergere.

Modul de funcționare al unui API REST, prezentat în Fig. 11, presupune că fiecare cerere este auto-conținută (stateless) — serverul nu păstrează informații despre starea sesiunii între cereri, ci toate datele necesare procesării sunt incluse în cererea însăși (de obicei prin header-ul Authorization care conține un token). Această proprietate permite scalarea orizontală a serverelor și simplifică modelul mental al aplicației.

În cadrul aplicației FARO, API-ul REST este expus de backend-ul Express sub prefixul `/api`, iar resursele principale sunt grupate pe module:

- `/api/auth/*` — autentificare (login, register, logout, refresh, OAuth);
- `/api/users/*` — gestiunea profilului utilizatorului;
- `/api/categories/*` — categorii de tranzacții;
- `/api/transactions/*` — tranzacții (CRUD, scanare bon);
- `/api/budgets/*` — bugete lunare;
- `/api/statistics/*` — agregate (overview, by-category, monthly-trend, anomalies);
- `/api/notifications/*` — notificări in-app;
- `/api/reports/*` — export PDF/Excel;
- `/api/insights/*` — insights AI generate de Gemini.

Răspunsurile sunt returnate în format JSON, cu o structură consistentă: `{ success: boolean, data: T, message?: string }`. Erorile sunt semnalate prin coduri HTTP standard (400 pentru validare eșuată, 401 pentru autentificare lipsă, 403 pentru autorizare insuficientă, 404 pentru resursă inexistentă, 409 pentru conflict — utilizat la avertizarea de depășire a bugetului).

## 2.8 JSON Web Tokens (JWT)

JSON Web Token este un standard deschis (RFC 7519) care definește o modalitate compactă și sigură de a transmite informații între părți sub forma unui obiect JSON. Un token JWT este format din trei părți separate prin punct: antetul (header), conținutul (payload) și semnătura (signature). Primele două părți sunt codate în Base64URL — adică citibile de oricine — iar a treia este o semnătură criptografică care garantează integritatea celorlalte două.

Este important de subliniat că JWT-ul nu este criptat — payload-ul este vizibil pentru oricine deține token-ul. Semnătura HMAC-SHA256, calculată cu un secret cunoscut doar de server, asigură că dacă cineva modifică payload-ul, semnătura nu se mai potrivește la verificare. Astfel, JWT garantează autenticitatea și integritatea datelor, nu confidențialitatea lor.

Modul de funcționare al autentificării JWT este prezentat în Fig. 14. În aplicația FARO am implementat un model dual-token, larg utilizat în aplicațiile web moderne:

- **Access token** cu durată scurtă (15 minute), trimis la fiecare cerere în header-ul Authorization. Acest token autentifică cererea și permite serverului să identifice utilizatorul fără a interoga baza de date.
- **Refresh token** cu durată lungă (7 zile), stocat într-un cookie httpOnly Secure SameSite=None. Acest token este folosit doar pentru a obține un nou access token când cel curent expiră, fără a forța utilizatorul să se autentifice din nou.

Avantajul acestui model este că, în cazul în care un access token este compromis, fereastra de exploatare este limitată la 15 minute. Cookie-ul cu refresh token este protejat împotriva atacurilor XSS prin atributul httpOnly (JavaScript nu îl poate citi) și împotriva atacurilor CSRF prin atributul SameSite.

## 2.9 Google Gemini — multimodal AI

Google Gemini este o familie de modele de inteligență artificială dezvoltate de Google DeepMind, lansate în 2023. Spre deosebire de generațiile anterioare de modele lingvistice (LLM-uri) care procesau doar text, Gemini este multimodal nativ — adică acceptă ca intrare combinații de text, imagini, audio și video, procesate într-o singură trecere prin rețeaua neuronală.

Pentru aplicația FARO am utilizat modelul `gemini-2.5-flash-lite`, ales pentru următoarele motive:

- **Multimodal** — capacitatea de a procesa imagini este esențială pentru funcționalitatea de scanare a bonurilor fiscale (Fig. 12);
- **Cost și disponibilitate** — modelul oferă o cotă gratuită generoasă de 1000 de cereri pe zi pe contul gratuit Google AI Studio, suficientă pentru utilizarea individuală și pentru demonstrație;
- **Latență mică** — răspunde în 1-3 secunde pentru cereri text, 3-5 secunde pentru cereri cu imagine;
- **Output JSON structurat** — modelul suportă modul `responseMimeType: "application/json"`, care garantează că răspunsul este JSON valid, fără a fi necesară parsare regex.

În aplicația FARO, Gemini este utilizat în patru locuri distincte:

1. **OCR bonuri fiscale** — extragerea structurată a magazinului, datei, liniilor de produse și totalului dintr-o poză;
2. **Sugestia automată de categorie** — pe baza descrierii unei tranzacții, modelul propune cea mai potrivită categorie din cele existente;
3. **Insights săptămânale** — generarea unor sfaturi financiare personalizate pe baza statisticilor de utilizare;
4. **Asistent AI conversațional** — un drawer accesibil în orice moment care răspunde la întrebări libere despre finanțele utilizatorului.

SDK-ul oficial Google (`@google/generative-ai`) este folosit pentru integrare, iar cheia API este stocată exclusiv pe partea de server, niciodată expusă clientului.

## 2.10 Resend — email transactional

Resend este un serviciu modern de trimitere a email-urilor transacționale, lansat în 2023. Spre deosebire de soluțiile clasice (SendGrid, Mailgun), Resend oferă un API minimalist și un SDK TypeScript-first, ceea ce simplifică semnificativ integrarea în aplicațiile moderne.

În aplicația FARO, Resend este utilizat exclusiv pentru email-urile de resetare a parolei (Fig. 15). Modul de funcționare:

1. Utilizatorul solicită resetarea introducând adresa de email;
2. Serverul generează un token aleator de 24 de bytes (codificat hex, 48 de caractere) și calculează hash-ul SHA-256;
3. Hash-ul este stocat într-un map in-memory cu durata de viață de 1 oră;
4. Tokenul original este inclus într-un link care pointează la pagina de resetare;
5. Serverul construiește un email HTML branded (cu logo, buton de acțiune, text explicativ) și îl trimite prin API-ul Resend;
6. Utilizatorul primește email-ul, accesează link-ul, introduce noua parolă;
7. Serverul re-calculează hash-ul, îl caută în map, validează expirarea, hash-uiește noua parolă cu bcrypt și o salvează.

Stocarea hash-ului în loc de tokenul original este o măsură suplimentară de securitate: chiar dacă cineva ar avea acces la map-ul intern, nu ar putea genera link-uri valide, pentru că nu poate inversa hash-ul SHA-256.

## 2.11 Railway — platformă de deploy

Railway este o platformă de tip Platform-as-a-Service (PaaS) modernă, care simplifică considerabil deploy-ul aplicațiilor web. Spre deosebire de Heroku (care a inspirat ergonomia) sau AWS (care oferă control complet dar necesită configurare extensivă), Railway oferă un echilibru între ușurință și flexibilitate.

Caracteristicile esențiale ale Railway pentru proiectul FARO includ:

- **Deploy automat din Git** — fiecare push pe ramura principală declanșează un build și deploy automat;
- **Detectare automată a stack-ului** — Railway recunoaște proiectele Node.js, Python, Go etc. și aplică build-ul potrivit fără configurare;
- **Plugin-uri pentru baze de date** — PostgreSQL, MySQL, Redis, MongoDB pot fi adăugate cu un singur click, iar variabilele de mediu de conexiune sunt injectate automat;
- **Edge TLS** — toate domeniile publice generate de Railway primesc certificate HTTPS automate;
- **Variabile de mediu** — configurabile prin dashboard sau prin referințe între servicii (de exemplu, `DATABASE_URL` din serviciul Postgres poate fi referită direct în serviciul backend).

Arhitectura de deployment pentru FARO (Fig. 18) include trei servicii distincte într-un singur proiect Railway:

- **PostgreSQL** — plugin oficial Railway, expus intern pe portul 5432;
- **Backend** (faro-backend) — Express + Prisma, expus public pe portul 4000 cu un domeniu *.up.railway.app;
- **Frontend** (faro-frontend) — bundle Vite servit static prin pachetul `serve`, expus public pe portul 3000.

Build-ul fiecărui serviciu este descris într-un fișier `railway.json` care specifică comenzile de build și start. Comanda de start a backend-ului include `prisma db push --skip-generate --accept-data-loss`, care sincronizează schema bazei de date la fiecare deploy — abordare suficientă pentru un proiect academic, înlocuibilă pentru producție cu `prisma migrate deploy` și fișiere de migrare versionate.

---

# CAPITOLUL 3 - DESCRIEREA GENERALĂ A PROIECTULUI

## 3.1 Prezentarea sumară a aplicației. Schema bloc

Aplicația FARO este o platformă web destinată gestiunii finanțelor personale, accesibilă din orice browser modern fără instalare locală. Scopul aplicației este de a oferi utilizatorului un instrument complet pentru înregistrarea veniturilor și cheltuielilor, planificarea bugetelor, analiza tendințelor financiare și automatizarea sarcinilor repetitive prin integrarea unui model de inteligență artificială.

Arhitectura aplicației, prezentată în schema bloc din Fig. 1, este organizată pe trei niveluri principale, conform paradigmei client-server:

**Nivelul Client** este reprezentat de aplicația web single-page construită cu React, care rulează direct în browser-ul utilizatorului. Această aplicație gestionează interacțiunea cu utilizatorul, randarea interfețelor și comunicarea cu serverul prin cereri HTTPS asincrone. Întreaga interfață este responsive, adaptându-se automat la dimensiunea ecranului — de la desktop la mobil.

**Nivelul Server** este compus din două componente colocate pe platforma Railway:
- API-ul Express + Prisma care expune endpoint-uri REST grupate pe module funcționale (autentificare, tranzacții, bugete, statistici, etc.) și implementează toată logica de business;
- Baza de date PostgreSQL care stochează informațiile utilizatorilor (conturi, tranzacții, bugete, categorii, notificări) cu garanții de integritate referențială și tranzacții ACID.

**Nivelul Servicii Externe** include două integrări cloud apelate exclusiv din server:
- Google Gemini pentru procesare AI multimodală (OCR bonuri, sugestii de categorie, generare insights, asistent conversațional);
- Resend pentru trimiterea email-urilor de resetare a parolei.

Comunicarea client-server se realizează exclusiv prin HTTPS, cu autentificare bazată pe token-uri JWT transmise în header-ul Authorization. Refresh token-ul este stocat într-un cookie httpOnly Secure SameSite=None, ceea ce îl protejează atât împotriva atacurilor XSS (JavaScript-ul din browser nu îl poate citi) cât și împotriva atacurilor CSRF (cookie-ul nu este trimis automat la cereri inițiate de alte site-uri).

[Insert Figura 1 — Schema bloc generală a aplicației]

Pe parte de implementare, fiecare modul al backend-ului urmează aceeași structură: un fișier de rute (`*.routes.ts`) definește endpoint-urile HTTP, un controller (`*.controller.ts`) extrage parametrii și răspunde, iar un serviciu (`*.service.ts`) implementează logica de business și interogările Prisma. Validarea cererilor primite este realizată prin biblioteca Zod, care permite definirea declarativă a schemelor și generarea automată a tipurilor TypeScript.

Frontend-ul folosește React Router pentru navigarea între pagini, TanStack Query pentru gestionarea cache-ului de server și Zustand pentru starea client-side (utilizatorul autentificat, token-ul de acces). Fiecare pagină este organizată ca un feature module în directorul `src/features/`, conținând componenta principală împreună cu sub-componentele specifice paginii.

## 3.2 Funcționalitățile aplicației

Aplicația FARO oferă utilizatorilor o gamă completă de funcționalități pentru gestiunea finanțelor personale, organizate pe șase module funcționale principale.

**Modulul Dashboard** este pagina de start și oferă o privire de ansamblu asupra stării financiare curente:

- Salutul personalizat în funcție de ora din zi (dimineața / ziua / seara);
- Trei carduri KPI cu sold curent, venituri și cheltuieli pentru luna curentă, fiecare însoțit de un sparkline care arată tendința pe ultimele luni;
- Alertă pentru tranzacțiile neobișnuite (cu z-score peste 2 față de media istorică a categoriei);
- Grafic linie cu evoluția veniturilor și cheltuielilor pe ultimele 12 luni;
- Grafic donut cu distribuția cheltuielilor pe categorii în luna curentă;
- Listă cu ultimele 5 tranzacții;
- Mini-vizualizare a progresului bugetelor active.

**Modulul Tranzacții** este responsabil pentru CRUD-ul tranzacțiilor:

- Listă paginată (10 tranzacții pe pagină) cu filtre pe segment (toate/venituri/cheltuieli/recurente), perioadă, categorii și interval de sumă;
- Căutare în descriere și sumă;
- Adăugare manuală a unei tranzacții prin formular;
- Scanare bon fiscal cu OCR Gemini (Fig. 12), cu preview-ul bonului digital înainte de salvare;
- Editare și ștergere;
- Suport pentru tranzacții recurente (zilnice, săptămânale, lunare, anuale) cu generare automată a instanțelor;
- Export al tranzacțiilor în format PDF sau Excel;
- Acces direct din modulul Bugete prin parametri URL pentru drill-down.

**Modulul Bugete** permite planificarea cheltuielilor:

- Card hero cu bugetul total al lunii curente;
- Listă de carduri pentru bugetele active (atât totale lunare cât și pe categorii);
- Creare și editare bugete cu interfață vizuală;
- Selector pentru navigarea între luni;
- Click pe un buget redirecționează la lista de tranzacții filtrată pe acea categorie și perioadă;
- Avertizare la depășirea limitei (atât în UI cât și prin notificare in-app — Fig. 16).

**Modulul Categorii** gestionează categoriile de venituri și cheltuieli:

- Listă cu toate categoriile, atât cele predefinite (Mâncare, Transport, Facturi etc.) cât și cele personalizate de utilizator;
- Adăugare categorie cu icoană (din setul Lucide sau emoji) și culoare;
- Editarea și ștergerea sunt permise doar pentru categoriile create de utilizator; cele predefinite sunt blocate;
- Sugerare automată a categoriei pentru o tranzacție pe baza descrierii (folosind Gemini).

**Modulul Rapoarte** oferă export-uri detaliate:

- Generator în trei pași: tip raport (venituri / cheltuieli / complet) → perioadă (luna curentă / ultimele 30 zile / trimestru / an / personalizat) → categorii selectate;
- Preview live al raportului cu KPI-uri, tabel detaliat pe categorii și diagramă donut;
- Export PDF generat cu PDFKit;
- Export Excel generat cu ExcelJS.

**Modulul Setări** permite personalizarea aplicației:

- Profil (nume, prenume, monedă, fotografie de profil);
- Securitate (schimbarea parolei, ștergerea contului);
- Preferințe (mod întunecat, sunete, format dată);
- Notificări (activarea/dezactivarea alertelor de buget).

În plus față de funcționalitățile specifice modulelor, aplicația include și componente transversale:

- **Bara de navigare laterală** cu acces la toate modulele și butonul de deconectare;
- **Bara de sus** cu breadcrumb, căutare globală (deschisă cu ⌘K/Ctrl+K), buton pentru asistentul AI (Fig. 17), clopoțel de notificări cu badge pentru mesajele necitite și buton pentru adăugare rapidă;
- **Asistent AI conversațional** accesibil în orice moment ca drawer lateral, care răspunde la întrebări libere despre finanțele utilizatorului folosind Gemini;
- **Paleta de căutare** care permite navigarea rapidă către orice pagină sau tranzacție;
- **Suport pentru mod întunecat** aplicat global prin CSS custom properties.

Aplicația suportă patru metode de autentificare:

- Cont local cu email și parolă (cu hashing bcrypt cost factor 10);
- Sign in cu Google prin OAuth 2.0;
- Sign in cu Facebook prin OAuth 2.0;
- Resetare parolă prin email cu link securizat (Fig. 15).

## 3.3 Planificarea lucrărilor

### 3.3.1 Ciclul de viață V

Dezvoltarea aplicației FARO a urmat modelul în V al ciclului de viață software, prezentat în Fig. 2. Acest model este o variantă a modelului clasic în cascadă, în care fiecare etapă de specificare de pe ramura stângă este pereche cu o etapă corespunzătoare de validare de pe ramura dreaptă. Spre exemplu, analiza cerințelor utilizatorului determină ce trebuie validat prin teste de acceptare, iar proiectarea detaliată dictează formele testelor unitare.

Avantajele alegerii modelului în V pentru acest proiect au inclus:

- **Trasabilitate clară între cerințe și teste** — fiecare cerință funcțională din etapa inițială are un caz de test corespunzător în etapa de validare;
- **Detectarea timpurie a defectelor** — planurile de testare sunt scrise în paralel cu specificațiile, ceea ce forțează identificarea ambiguităților înainte de a începe codarea;
- **Documentare structurată** — fiecare etapă produce un livrabil specific (specificații, arhitectură, cod, raport de testare), ceea ce facilitează redactarea documentației finale.

Etapele parcurse în dezvoltarea aplicației FARO au fost:

1. **Analiza cerințelor** — identificarea funcționalităților necesare, a profilurilor utilizatorilor și a constrângerilor tehnice;
2. **Specificații funcționale** — descrierea detaliată a comportamentului fiecărui modul, a fluxurilor de utilizare și a regulilor de business;
3. **Proiectare arhitecturală** — alegerea stack-ului tehnologic, definirea separării frontend/backend, proiectarea API-ului REST;
4. **Proiectare detaliată** — schema bazei de date, structura modulelor, interfețele între componente;
5. **Implementare** — scrierea codului efectiv pentru backend, frontend și integrările cu servicii externe;
6. **Teste unitare** — validarea individuală a serviciilor critice (BudgetValidator, RecurringTransactionEngine, etc.);
7. **Teste de integrare** — verificarea funcționării corecte între componente (frontend ↔ API ↔ bază de date);
8. **Teste sistem** — testarea aplicației complete în mediul de producție;
9. **Teste de acceptare** — validarea finală împotriva cerințelor inițiale.

### 3.3.2 Diagrama Gantt

Diagrama Gantt este un instrument de planificare frecvent utilizat în managementul de proiect, care oferă o ilustrare grafică a programului de activități. Aceasta ajută la planificarea, coordonarea și monitorizarea sarcinilor dintr-un proiect. Forma grafică constă într-o matrice în care pe axa orizontală se reprezintă timpul, iar pe axa verticală sunt enumerate sarcinile proiectului.

Planificarea aplicației FARO a urmat un calendar de aproximativ șase luni, structurat pe patru faze majore:

| Sarcină | Data începerii | Numărul de zile | Data finalizării |
|---|---|---|---|
| Documentare și research | 01/12/2025 | 14 | 14/12/2025 |
| Specificații funcționale | 15/12/2025 | 10 | 24/12/2025 |
| Setup mediu de dezvoltare | 25/12/2025 | 5 | 29/12/2025 |
| Proiectare bază de date | 01/01/2026 | 7 | 07/01/2026 |
| Autentificare (JWT + OAuth) | 08/01/2026 | 10 | 17/01/2026 |
| CRUD Tranzacții | 18/01/2026 | 14 | 31/01/2026 |
| Module Bugete și Categorii | 01/02/2026 | 14 | 14/02/2026 |
| Statistici și Rapoarte | 15/02/2026 | 14 | 28/02/2026 |
| Integrare AI (Gemini OCR + insights) | 01/03/2026 | 21 | 21/03/2026 |
| Notificări și email reset parolă | 22/03/2026 | 7 | 28/03/2026 |
| UI redesign și mod întunecat | 29/03/2026 | 14 | 11/04/2026 |
| Responsive mobile | 12/04/2026 | 7 | 18/04/2026 |
| Testare și bug fixing | 19/04/2026 | 14 | 02/05/2026 |
| Deploy pe Railway | 03/05/2026 | 5 | 07/05/2026 |
| Redactare documentație | 08/05/2026 | 21 | 28/05/2026 |
| Pregătire susținere | 29/05/2026 | 10 | 07/06/2026 |

**Tabel 1 — Planificarea lucrării**

Diagrama Gantt corespunzătoare este prezentată în Fig. 3.

[Insert Figura 3 — Diagrama Gantt]

Cele patru faze majore identificabile în calendar sunt:

- **Faza de planificare** (decembrie 2025) — documentare, specificații, setup mediu;
- **Faza de implementare** (ianuarie - martie 2026) — dezvoltarea propriu-zisă a celor șase module funcționale și integrarea cu serviciile externe;
- **Faza de polish și deploy** (aprilie - mai 2026) — redesign UI, optimizare mobilă, testare, deploy în producție;
- **Faza de documentare și susținere** (mai - iunie 2026) — redactarea lucrării de licență și pregătirea prezentării.

Această planificare a permis o dezvoltare incrementală — fiecare modul a fost complet funcțional la sfârșitul perioadei alocate, astfel încât la final aplicația a fost gata pentru deploy fără o fază lungă de integrare. Faza de polish, deși aparent mai scurtă, a inclus o serie de iterații vizuale și de optimizare a experienței utilizatorului care nu erau previzibile la începutul proiectului.

---

> **CAPITOLELE 4-7 vor fi adăugate în versiunea următoare a acestui document.**
>
> Capitolul 4 (Proiectarea în detaliu) va include considerațiile de implementare, arhitectura completă (Fig. 13), schema tehnologiilor (Fig. 4), arhitectura pe module (Fig. 5.1-5.6), structura fișierelor (Fig. 6), schema bazei de date (Fig. 7) cu detaliile fiecărei tabele (Fig. 8.1-8.6), fluxurile complexe (OCR, JWT, reset parolă, notificări, AI) — Fig. 9, 10, 12, 14, 15, 16, 17 — și arhitectura de deployment Railway (Fig. 18).
>
> Capitolul 5 (Utilizarea aplicației) va prezenta interfețele cu capturi de ecran pentru fiecare modul.
>
> Capitolul 6 (Testarea aplicației) va conține planul de testare, obiectivele, funcțiile testate, mediul, metodologia și raportul de testare în format tabelar.
>
> Capitolul 7 (Concluzii) va sintetiza contribuțiile aplicației și direcțiile de dezvoltare ulterioară.
