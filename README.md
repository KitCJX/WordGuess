# WordGuess — Word Puzzle Game

WordGuess is a high-fidelity, interactive web-based word puzzle game built on a **purely vanilla web stack** (HTML, CSS, and JavaScript). Taking inspiration from the classic Wordle, this reworked version leverages modern browser APIs, dark slate aesthetics, programmatic sound synthesis, and local storage state persistence.

## 🔗 Live Demo

Play the game live here: [kitcjx.github.io/WordGuess/](https://kitcjx.github.io/WordGuess/)

---

## 🌟 Features

- **Direct-Keyboard Grid Board**: Type letters directly on your physical keyboard or tap the responsive on-screen keyboard. Pop-in animations trigger as you compose your guess.
- **Sequential 3D Tile Flips**: Smooth, hardware-accelerated 3D horizontal rotations flip each tile one by one when a guess is submitted, swapping the background color precisely at the 90-degree midpoint.
- **Programmatic Audio Synthesizer**: Utilizes the native **Web Audio API** to generate retro-style sound effects (key clicks, deletion taps, error vibrations, success arpeggios, and failure slide downs) without loading external audio files. Includes a mute switch.
- **Glassmorphic Theme Customization**: Custom settings dialog menu featuring a **Dark/Light Mode** toggle, **Colorblind Mode** high-contrast color scheme overrides, and mute switches using modern CSS custom property variables and backdrop filters.
- **Statistics & Streaks Tracker**: Tracks games played, win percentage, current streak, max streak, and guess frequency distributions saved securely in the browser's local storage (`localStorage`).
- **Post-Game Dictionary definitions**: Queries the Dictionary API to show phonetic spellings, parts of speech, and definitions when the game finishes, with an interactive button to play native audio pronunciations if available.
- **Dual-List Resilient Validation**: Validates user guesses against a secondary allowed list of **~10,600 dictionary words**, while daily target words are selected from a curated list of **~2,300 guessable common words**.
- **Offline & Fallback Support**: Automatically prioritizes loading local lists, falling back to raw GitHub CDN URLs if CORS or local files are blocked, and defaults to a hardcoded array if offline.

---

## 🎮 How to Play

1. The game selects a secret 5-letter word from the solution bank.
2. You have 6 attempts to guess the word.
3. Type letters and press **Enter** to submit your guess, or **Backspace** to delete.
4. After each guess, the color of the tiles will change to show how close your guess was to the word:
   - 🟩 **Green (or Orange in Colorblind mode)**: The letter is correct and in the right position.
   - 🟨 **Yellow (or Light Blue in Colorblind mode)**: The letter is in the word but in the wrong position.
   - ⬛ **Gray**: The letter is not in the word in any position.
5. The virtual keyboard keys update color dynamically to help you keep track of used letters.

---

## 🛠️ Technical Details

Built from scratch using modern modular ES6 Javascript:
- **`index.html`**: Semantic layout, dialog components, keyboard structure, and vector SVG assets.
- **`style.css`**: Styling variables (light/dark/colorblind), GPU-optimized keyframe animations, and mobile-first media queries.
- **`src/main.js`**: Key binders, button click handlers, and developer tools.
- **`src/game.js`**: State machine, Wordle-rule letter matching, and stats persistence.
- **`src/ui.js`**: DOM controller, dialogue animations, horizontal stats chart renderer, and toast overlays.
- **`src/api.js`**: Dual-list downloader and Dictionary API definition queries.
- **`src/audio.js`**: Web Audio synthesizer waves.

---

## 🚀 Setup and Run Locally

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/KitCJX/WordGuess.git
   ```
2. Run a local web server (needed to load the local word lists due to modern browser file-security checks):
   - Using Python:
     ```bash
     python3 -m http.server 8080
     ```
   - Or using Node:
     ```bash
     npx http-server -p 8080
     ```
3. Open `http://localhost:8080` in your web browser.

**Developer Cheat Code**: Open your browser developer console (F12) and run `alohomora()` to see the solution word.

---

## ✍️ Credits

Created by **CJX1001**

