# LaTeX — Lucrare de diplomă FARO

Fișierul `licenta.tex` este sursa LaTeX a lucrării. **Pagina de titlu** urmează template-ul lui Valentin Plămădeală (Sesiunea Iunie 2025, UPT FAC), iar **restul conținutului** păstrează structura modelată după lucrarea Giuliei Barbu (capitole 1-7 cu placeholders pentru toate cele 29 de figuri pe care le-ai generat).

## Cum compilezi (recomandat: Overleaf, fără instalare)

1. Deschide [overleaf.com](https://www.overleaf.com) și creează cont gratuit.
2. **New Project → Blank Project** (numește-l "Licenta FARO").
3. Șterge fișierul `main.tex` creat default.
4. **Upload** → încarcă `licenta.tex` din acest folder.
5. Sus dreapta lângă numele fișierului, click pe meniul cu trei puncte → **Set as main file**.
6. Click **Recompile** (butonul verde sus). Așteaptă ~10 secunde.

Gata, PDF-ul apare pe partea dreaptă. Îl poți descărca de la **Menu → Download PDF**.

## Cum compilezi local

Instalează MacTeX (pe macOS):
```bash
brew install --cask mactex
```

Apoi din directorul `latex/`:
```bash
pdflatex licenta.tex
pdflatex licenta.tex    # rulează de DOUĂ ori ca să se rezolve TOC + referințele
```

Sau cu `latexmk`:
```bash
latexmk -pdf licenta.tex
```

## Logo UPT pe pagina de titlu

1. Descarcă sigla oficială UPT de pe [upt.ro](https://www.upt.ro/) („Identitate vizuală") sau caută `logo upt png transparent` pe Google Images.
2. Pune fișierul ca `latex/figuri/logo-upt.png` (sau `.pdf` dacă ai PDF vectorial).
3. Recompilezi — apare automat sus pe pagina de titlu. Dacă fișierul lipsește, în locul lui apare un dreptunghi gri `[ logo UPT ]`.

## Pagina de titlu (template Valentin)

- Logo UPT sus, centrat
- Universitatea Politehnica Timișoara / Facultatea de Automatică și Calculatoare / Automatică și Informatică Aplicată
- **LUCRARE DE DIPLOMĂ** mare bold
- Titlul proiectului în italic dedesubt
- **Absolvent** aliniat la dreapta
- **Coordonator** aliniat la stânga
- Timișoara, 2026 + Sesiunea Iunie 2026 jos

## Cele 29 de figuri așteptate (placeholders deja în text)

| # | Descriere |
|---|---|
| Fig. 1 | Schema bloc generală a aplicației |
| Fig. 1.1 | Schema bloc a aplicației — vedere cloud |
| Fig. 2 | Modelul V de dezvoltare |
| Fig. 3 | Diagrama Gantt |
| Fig. 4 | Schema tehnologiilor utilizate |
| Fig. 5.1 | Arhitectura modulului Dashboard |
| Fig. 5.2 | Arhitectura modulului Tranzacții |
| Fig. 5.3 | Arhitectura modulului Bugete |
| Fig. 5.4 | Arhitectura modulului Categorii |
| Fig. 5.5 | Arhitectura modulului Rapoarte |
| Fig. 5.6 | Arhitectura modulului Setări |
| Fig. 6 | Structura fișierelor proiectului |
| Fig. 7 | Schema bazei de date (Entity-Relationship) |
| Fig. 8 | Structurile tuturor tabelelor (consolidat) |
| Fig. 8.1 | Structura tabelei User |
| Fig. 8.2 | Structura tabelei Category |
| Fig. 8.3 | Structura tabelei Transaction |
| Fig. 8.4 | Structura tabelei Budget |
| Fig. 8.5 | Structura tabelei BudgetCategory |
| Fig. 8.6 | Structura tabelei Notification |
| Fig. 9 | Flux de scanare a bonului fiscal (OCR) |
| Fig. 10 | Flux de autentificare JWT cu refresh rotation |
| Fig. 11 | Modul de funcționare al API-ului REST |
| Fig. 12 | Modul de funcționare al scanării bonului (OCR) |
| Fig. 13 | Arhitectura aplicației — vedere de ansamblu |
| Fig. 14 | Modul de funcționare al autentificării JWT |
| Fig. 15 | Modul de funcționare al resetării parolei |
| Fig. 16 | Modul de funcționare al notificărilor de buget |
| Fig. 17 | Modul de funcționare al asistentului AI |
| Fig. 18 | Arhitectura de deployment pe Railway |

Când vrei să înlocuiești un placeholder cu imaginea reală:

1. Pune fișierul ca `latex/figuri/fig-N.png` (de ex. `figuri/fig-5.1.png`).
2. Înlocuiește `\placeholderfig{N}{Descriere}` cu:
   ```latex
   \begin{figure}[H]
     \centering
     \includegraphics[width=0.85\textwidth]{figuri/fig-N.png}
     \caption{Descriere}
     \label{fig:fN}
   \end{figure}
   ```

## Ce conține deja documentul

✅ **Pagina de titlu** stil Valentin (logo UPT + LUCRARE DE DIPLOMĂ + Absolvent dreapta + Coordonator stânga + Sesiunea Iunie 2026)

✅ **Cuprins, Lista figurilor, Lista tabelelor** — auto-generate

✅ **Capitolul 1 — INTRODUCERE** (complet: Context general, Tema proiectului, Structura pe capitole)

✅ **Capitolul 2 — FUNDAMENTAREA TEORETICĂ** (complet: 11 tehnologii — React, TypeScript, Vite, Node.js+Express, Prisma, PostgreSQL, REST API, JWT, Gemini, Resend, Railway)

✅ **Capitolul 3 — DESCRIEREA GENERALĂ** (Schema bloc + Schema cloud + funcționalități pe 6 module + Modelul V + Diagrama Gantt cu tabel + Schema tehnologii + Arhitectura modulelor)

🟡 **Capitolele 4-7** — scheletul există cu titluri și placeholder-uri pentru figurile aferente; aici lași loc pentru text după ce trimiți primele 3 capitole la profesoară

✅ **Bibliografie** — 14 referințe

## Convenții folosite

- **Font:** Latin Modern (12pt)
- **Line spacing:** 1.5 (`\onehalfspacing`)
- **Indent prim rând:** 1 cm
- **Margini:** sus/jos 2.5cm, stânga 3cm, dreapta 2.5cm
- **Header:** titlul aplicației (italic, mic) în stânga
- **Footer:** facultate stânga + număr pagină dreapta
- **Capitole:** stil clasic UPT, „CAPITOLUL X TITLU" centrat
- **Citări:** `\cite{ref:xxx}` + `\bibitem{ref:xxx}`
- **Figuri:** `\placeholderfig{N}{Descriere}` generează automat un dreptunghi gri vizibil + caption + label
