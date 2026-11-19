# Grade 6 Science Chapter 6: Reproduction (အခန်း ၆ — မျိုးပွားခြင်း)

An interactive Burmese Unicode educational web project designed for an **ICT Show** exhibition, faithfully adapted from the **Myanmar Grade 6 Science Textbook, Chapter 6: Reproduction (Pages 53–58)**.

## How to Run Locally (VS Code & Chrome)

1. Unzip `grade6-ch6-reproduction.zip` into a folder.
2. **Direct Chrome Launch:** Double-click `index.html` to open directly in Google Chrome (all buttons, animations, sound effects, flip cards, simulators, and quizzes work offline over `file://`).
3. **VS Code Live Server (Recommended):** Open the folder in VS Code, right-click `index.html`, and choose **Open with Live Server**.
4. **Or via Python / Node:**
   - `python3 -m http.server 8000`
   - `npx serve .`

## File Structure

- `index.html` — Clean, navbar-free Adventure Welcome Page featuring an illustrated archipelago scene and leading into the Home Page (`map.html`)
- `map.html` — Main Home Page & Adventure World Map Hub, Chapter 6 Data Graphs, Textbook Pages Gallery, and Chapters 1–11 Overview
- `living-things.html` — Section 6-1 Living Things Reproduction, Figure 6-1 Photos, Page 53 Table, and Page 54 Exercises
- `plants.html` — Section 6-2 Plant Reproduction, Interactive SVG Flower Lab (Figure 6-2), Fern Spores (Figure 6-3), 3D Flip Cards (Figure 6-4), and Page 56 Exercises
- `animals.html` — Section 6-3 Animal Reproduction, Filterable Animal Cards (Figures 6-5 to 6-8), Fertilization Simulator, and Page 58 Exercises
- `review.html` — Chapter 6 Review Concept Map (Page 58) with Tap-to-Reveal, Word-Bank Fill-in, and Data Graphs
- `games.html` — 3 Interactive Exercise Games: (1) Speed Sort Classifier, (2) Science Memory Match Pairs, and (3) Life Cycle & Process Sequencer
- `quiz.html` — Expanded 12-Question Interactive Quiz Arena with 3 modes (5-question quick, 8-question medium, 12-question full challenge), streak tracking, sound effects, and confetti celebration
- `style.css` — Mobile-first responsive CSS with fluid `clamp()` typography and Burmese `line-height: 1.9+` safeguards
- `app.js` — Core interactive engine (`safeStorage` with `localStorage` + `file://` fallback, Web Audio API SFX, animations, labs, 3 games, and 12-question quiz)
- `images/ch6/` — Extracted textbook photographs, diagrams, tables, and full Pages 53–58
