# LaTeX — Lucrare de diplomă FARO

Fișierul `licenta.tex` este sursa LaTeX a lucrării, după template-ul lucrării lui **Valentin Plămădeală** (Informatica Zi, UPT FAC, Sesiunea Iunie 2025), adaptat la proiectul tău FARO.

## Cum compilezi (recomandat: Overleaf, fără instalare)

1. Deschide [overleaf.com](https://www.overleaf.com) și creează cont gratuit.
2. **New Project → Blank Project** (numește-l "Licenta FARO").
3. Șterge fișierul `main.tex` creat default.
4. **Upload** → încarcă `licenta.tex` din acest folder.
5. Sus dreapta lângă numele fișierului, click pe meniul cu trei puncte → **Set as main file**.
6. Click **Recompile** (butonul verde sus). Așteaptă ~10 secunde.

Gata, PDF-ul apare pe partea dreaptă. Îl poți descărca de la **Menu → Download PDF**.

## Cum compilezi local (dacă vrei pe calculatorul tău)

Instalează MacTeX (pe macOS):
```bash
brew install --cask mactex
```

Sau MikTeX pe Windows: [miktex.org/download](https://miktex.org/download)

Apoi din directorul `latex/`:
```bash
pdflatex licenta.tex
pdflatex licenta.tex    # rulează de DOUĂ ori ca să se rezolve TOC + referințele
```

Sau cu `latexmk` (face singur câte compilări sunt necesare):
```bash
latexmk -pdf licenta.tex
```

## Logo UPT pe pagina de gardă

Pe pagina de gardă lași loc pentru sigla UPT sus, centrat. Ca să apară:

1. Descarcă sigla oficială UPT de pe [upt.ro](https://www.upt.ro/) (secțiunea „Identitate vizuală") sau caută `logo upt` pe Google Images în format PNG transparent.
2. Pune fișierul ca `latex/figuri/logo-upt.png` (sau `.pdf` dacă ai PDF vectorial).
3. Recompilezi — apare automat. Dacă nu există fișierul, în locul lui apare un dreptunghi gri cu textul `[ logo UPT ]` (placeholder care îți semnalează că lipsește).

## Ce conține deja (capitolele 1-3)

✅ **Pagina de gardă** (template Valentin) — logo UPT + UPT/FAC/AIA + **LUCRARE DE DIPLOMĂ** + titlul proiectului în italic + Absolvent (dreapta) + Coordonator (stânga) + Timișoara 2026 + Sesiunea Iunie 2026

✅ **Rezumat** — paragraf abstract care sintetizează tema, stack-ul și contribuțiile

✅ **Cuprins, Listă de figuri, Listă de tabele** — auto-generate, numerotare romană (i, ii, iii…) pentru front matter

✅ **Capitolul 1 — Introducere** (6 secțiuni)
  - 1.1 Motivația alegerii temei
  - 1.2 Obiectivele generale ale lucrării (tehnice + de cercetare)
  - 1.3 Relevanța științifică și gradul de noutate (contribuții originale + context)
  - 1.4 Strategia cercetării și metodologia folosită (abordare + instrumente)
  - 1.5 Structura lucrării
  - 1.6 Limitele lucrării

✅ **Capitolul 2 — Studii anterioare** (8 secțiuni de tip literature review)
  - 2.1 Aplicații financiare existente (Mint, YNAB, Revolut, Firefly III…)
  - 2.2 Tehnologii frontend (React vs Vue vs Angular, Vite, TypeScript)
  - 2.3 Tehnologii backend (Node vs Deno vs Bun, Express vs Fastify, Prisma vs Drizzle)
  - 2.4 Baze de date (PostgreSQL vs MySQL vs SQLite, JSONB)
  - 2.5 Securitate (JWT, bcrypt, OAuth 2.0, OWASP)
  - 2.6 LLM multimodale (Gemini vs GPT-4V vs Claude, Tesseract vs LLM)
  - 2.7 Servicii externe (Resend, Railway vs Vercel vs Render)
  - 2.8 Concluzii

✅ **Capitolul 3 — Metodologie și arhitectura sistemului** (8 secțiuni)
  - 3.1 Analiza cerințelor (funcționale + non-funcționale + scenarii)
  - 3.2 Arhitectura generală (principii + schema bloc + flux date)
  - 3.3 Selecția tehnologiilor (criterii + stack frontend + backend + servicii)
  - 3.4 Modelarea datelor (schema relațională + JSONB pentru bonuri)
  - 3.5 Securitate și performanță (JWT, validare, CORS, optimizări)
  - 3.6 Designul detailat al modulelor (6 module, fiecare descris)
  - 3.7 Procesul de dezvoltare (Modelul V + Gantt cu tabel real)
  - 3.8 Concluzii arhitecturale

✅ **Bibliografie** — 30 de referințe numerotate `[1]`, `[2]`, … în stil IEEE, citate inline în text exact acolo unde apare claim-ul

🟡 **Capitolele 4-6** — se vor adăuga după ce trimiți primele 3 capitole la profesoară:
  - Cap 4 — Implementarea prototipului
  - Cap 5 — Rezultate și evaluare
  - Cap 6 — Concluzii și dezvoltări viitoare

## Cum completezi capitolele 4-6

Când vrei să înlocuiești un placeholder de figură cu o imagine reală:

1. Pune fișierul imagine (PNG/JPG/PDF) într-un subfolder `figuri/` în același loc cu `licenta.tex`.
2. Înlocuiește `\placeholderfig{N}{Descriere}` cu:
   ```latex
   \begin{figure}[H]
     \centering
     \includegraphics[width=0.85\textwidth]{figuri/numefisier.png}
     \caption{Descriere}
     \label{fig:fN}
   \end{figure}
   ```

## Convenții folosite (template Valentin Plămădeală)

- **Font:** Latin Modern (12pt)
- **Line spacing:** 1.5 (`\onehalfspacing`)
- **Indent prim rând:** 1 cm
- **Margini:** sus/jos 2.5cm, stânga 3cm, dreapta 2.5cm
- **Capitole:** numerotate „1 Introducere", „2 Studii anterioare", fără „CAPITOLUL X"
- **Header:** titlul capitolului curent în partea de sus-stânga (italic), număr pagină jos-centrat
- **Front matter:** numerotare romană (i, ii, iii) începând cu Rezumatul
- **Content matter:** numerotare arabă (1, 2, 3) începând cu Capitolul 1
- **Citări:** stil numeric `[1]`, `[2]`, generate automat din `\cite{ref:xxx}` + `\bibitem{ref:xxx}`
- **Tabele:** stil booktabs cu linii orizontale subțiri

## Note pentru profesoară

Lucrarea respectă formatul standard UPT (Universitatea Politehnica Timișoara) după template-ul folosit recent (2025) de Valentin Plămădeală, absolvent al specializării Informatica Zi de la aceeași facultate (Automatică și Calculatoare). Singura adaptare față de template-ul original este denumirea specializării, schimbată în „Automatică și Informatică Aplicată" pentru a corespunde profilului absolventului.

Pentru orice modificare de format cerută de profesoară (font diferit, dimensiune diferită, alt stil de header, ordinea secțiunilor în capitolul 1), editezi preambulul din `licenta.tex` (primele ~90 de linii) sau capitolul respectiv.
