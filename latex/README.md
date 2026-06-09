# LaTeX — Lucrare de licență FARO

Fișierul `licenta.tex` este sursa LaTeX a lucrării, după modelul tezei Giuliei Barbu, adaptată la proiectul tău FARO.

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

## Ce conține deja

✅ **Pagina de gardă** — Universitatea Politehnica Timișoara, FAC, AIA + titlul FARO + Absolvent + Conducător + Timișoara 2026 (două pagini, cum a făcut Giulia)

✅ **Cuprins automat** — generat de LaTeX din `\chapter` și `\section`

✅ **Lista figurilor automată** — generată din `\caption` și `\placeholderfig`

✅ **Lista tabelelor automată**

✅ **Capitolul 1 — INTRODUCERE** — complet (Context general, Tema proiectului, Structura pe capitole)

✅ **Capitolul 2 — FUNDAMENTAREA TEORETICĂ** — complet (11 tehnologii: React, TypeScript, Vite, Node.js+Express, Prisma, PostgreSQL, REST API, JWT, Gemini, Resend, Railway)

✅ **Capitolul 3 — DESCRIEREA GENERALĂ** — complet (Schema bloc + funcționalități pe 6 module + Modelul V + Diagrama Gantt cu tabel real)

🟡 **Capitolele 4-7** — schelet cu titlurile secțiunilor și placeholder-e pentru figuri. Aici lași loc să adaugi tu conținutul după ce trimiți primele 3 capitole la profesoară.

✅ **Bibliografie** — 14 referințe bibliografice formatate corect

## Cum completezi capitolele 4-7

Caută în `licenta.tex` comentariile `% TODO` — sunt punctele unde trebuie să adaugi text. Fiecare placeholder de figură arată așa în PDF compilat:

```
┌─────────────────────────────────────────┐
│                                         │
│   [ Inserează aici imaginea — Figura N: │
│     Descriere ]                          │
│                                         │
└─────────────────────────────────────────┘

  Figura N — Descriere
```

Când vrei să înlocuiești un placeholder cu o imagine reală:

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

## Conventii folosite

- **Font:** Latin Modern (similar Times New Roman, dar SVG-friendly în PDF)
- **Mărime corp text:** 12pt
- **Line spacing:** 1.5 (`\onehalfspacing`)
- **Indent prim rând:** 1 cm
- **Margini:** sus/jos 2.5cm, stânga 3cm (pentru îndoit), dreapta 2.5cm
- **Header:** titlul aplicației (italic, mic)
- **Footer:** facultate + număr pagină
- **Capitole pe pagină nouă automat**
- **Referințe automate** cu `\ref{fig:fN}` și `\cite{ref:xxx}`

## Note pentru profesoară

Lucrarea respectă formatul standard UPT (Universitatea Politehnica Timișoara) inspirat din lucrarea Giuliei Barbu (2019) — același template pe care îl folosesc majoritatea studenților de la Facultatea de Automatică și Calculatoare, Specializarea Automatică și Informatică Aplicată.

Pentru orice modificare de format cerută de profesoară (font diferit, dimensiune diferită, alt stil de header), editezi preambulul din `licenta.tex` (primele ~80 de linii).
