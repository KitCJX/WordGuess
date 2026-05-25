import * as game from './game.js';
import * as audio from './audio.js';

// DOM Elements
const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const toastContainer = document.getElementById("toast-container");

// HUD elements
const timerBar = document.getElementById("timer-bar");
const gameTimer = document.getElementById("game-timer");
const gameScore = document.getElementById("game-score");
const clueBar = document.getElementById("clue-bar");
const gameClue = document.getElementById("game-clue");
const modeTitle = document.getElementById("mode-title");

// Modals
const helpDialog = document.getElementById("help-dialog");
const statsDialog = document.getElementById("stats-dialog");
const settingsDialog = document.getElementById("settings-dialog");
const modeDialog = document.getElementById("mode-dialog");
const passplayDialog = document.getElementById("passplay-dialog");

// Action Buttons
const helpBtn = document.getElementById("help-btn");
const statsBtn = document.getElementById("stats-btn");
const settingsBtn = document.getElementById("settings-btn");
const modeBtn = document.getElementById("mode-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const shareBtn = document.getElementById("share-btn");
const pronounceAudioBtn = document.getElementById("pronounce-audio-btn");

// Close buttons for dialogs
const closeBtns = document.querySelectorAll("dialog .close-btn");

// Settings Toggles
const soundToggle = document.getElementById("sound-toggle");
const themeToggle = document.getElementById("theme-toggle");
const colorblindToggle = document.getElementById("colorblind-toggle");
const hardModeToggle = document.getElementById("hardmode-toggle");

// Stats Spans
const statPlayed = document.getElementById("stat-played");
const statWinPct = document.getElementById("stat-winpct");
const statStreak = document.getElementById("stat-streak");
const statMaxStreak = document.getElementById("stat-maxstreak");
const guessDistContainer = document.getElementById("guess-dist");

// Dictionary Card
const dictionaryCard = document.getElementById("dictionary-card");
const dictWord = document.getElementById("dict-word");
const dictPhonetics = document.getElementById("dict-phonetics");
const dictMeanings = document.getElementById("dict-meanings");

// Pass & Play Elements
const customWordInput = document.getElementById("custom-word-input");
const customWordSubmit = document.getElementById("custom-word-submit");
const passplayCancelBtn = document.getElementById("passplay-cancel");
const toggleWordVisibility = document.getElementById("toggle-word-visibility");
const passplayError = document.getElementById("passplay-error");

let pronunciationAudio = null;
let modeSelectHandler = null;
let passPlaySubmitHandler = null;
let passPlayCancelHandler = null;

// Initialize Settings and Dialog Bindings
export function setupSettings() {
  // Theme Setup
  let savedTheme = localStorage.getItem("wordguess_theme");
  if (!savedTheme) {
    savedTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  const isDark = savedTheme === "dark";
  themeToggle.checked = isDark;
  
  if (isDark) {
    document.documentElement.classList.add("dark-theme");
    document.documentElement.classList.remove("light-theme");
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = "dark";
  } else {
    document.documentElement.classList.add("light-theme");
    document.documentElement.classList.remove("dark-theme");
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = "light";
  }
  
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.documentElement.classList.remove("light-theme");
      document.documentElement.classList.add("dark-theme");
      localStorage.setItem("wordguess_theme", "dark");
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.content = "dark";
    } else {
      document.documentElement.classList.remove("dark-theme");
      document.documentElement.classList.add("light-theme");
      localStorage.setItem("wordguess_theme", "light");
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.content = "light";
    }
  });

  // Sound Setup
  soundToggle.checked = audio.isSoundEnabled();
  soundToggle.addEventListener("change", () => {
    audio.setSoundEnabled(soundToggle.checked);
  });

  // Colorblind Setup
  const savedColorblind = localStorage.getItem("wordguess_colorblind") === "true";
  colorblindToggle.checked = savedColorblind;
  if (savedColorblind) {
    document.documentElement.classList.add("colorblind-theme");
  } else {
    document.documentElement.classList.remove("colorblind-theme");
  }
  
  colorblindToggle.addEventListener("change", () => {
    if (colorblindToggle.checked) {
      document.documentElement.classList.add("colorblind-theme");
      localStorage.setItem("wordguess_colorblind", "true");
    } else {
      document.documentElement.classList.remove("colorblind-theme");
      localStorage.setItem("wordguess_colorblind", "false");
    }
  });

  // Hard Mode Setup
  const savedHardMode = localStorage.getItem("wordguess_hardmode") === "true";
  hardModeToggle.checked = savedHardMode;
  game.setHardMode(savedHardMode);
  
  hardModeToggle.addEventListener("change", () => {
    game.setHardMode(hardModeToggle.checked);
    localStorage.setItem("wordguess_hardmode", hardModeToggle.checked ? "true" : "false");
  });

  // Dialog Button Click Listeners
  helpBtn.addEventListener("click", () => {
    const currentMode = game.getGameMode();
    const sections = helpDialog.querySelectorAll(".help-mode-section");
    sections.forEach(sec => {
      if (sec.id === `help-content-${currentMode}`) {
        sec.style.display = "block";
      } else {
        sec.style.display = "none";
      }
    });
    helpDialog.showModal();
  });
  statsBtn.addEventListener("click", () => showStatsModal());
  settingsBtn.addEventListener("click", () => settingsDialog.showModal());
  modeBtn.addEventListener("click", () => modeDialog.showModal());
  
  closeBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.target.closest("dialog").close();
    });
  });

  // Close dialog on clicking backdrop (Fallback for browsers without native closedby support)
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    [helpDialog, statsDialog, settingsDialog, modeDialog].forEach(dialog => {
      dialog.addEventListener("click", (e) => {
        if (e.target !== dialog) return;
        const dialogDimensions = dialog.getBoundingClientRect();
        if (
          e.clientX < dialogDimensions.left ||
          e.clientX > dialogDimensions.right ||
          e.clientY < dialogDimensions.top ||
          e.clientY > dialogDimensions.bottom
        ) {
          dialog.close();
        }
      });
    });
  }

  // Pronounce Audio click
  pronounceAudioBtn.addEventListener("click", () => {
    if (pronunciationAudio) {
      pronunciationAudio.play().catch(err => console.log("Audio play blocked", err));
    }
  });

  // Mode Selection Card Clicks
  const modeCards = modeDialog.querySelectorAll(".mode-card");
  modeCards.forEach(card => {
    card.addEventListener("click", () => {
      // Highlight selection
      modeCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      
      modeDialog.close();
      
      const newMode = card.dataset.mode;
      if (modeSelectHandler) {
        modeSelectHandler(newMode);
      }
    });
  });

  // Pass & Play Visibility Toggle
  toggleWordVisibility.addEventListener("click", () => {
    const isSecret = customWordInput.classList.contains("masked-input");
    if (isSecret) {
      customWordInput.classList.remove("masked-input");
    } else {
      customWordInput.classList.add("masked-input");
    }
    
    // Toggle icon state
    toggleWordVisibility.innerHTML = isSecret
      ? `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
      : `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  });

  // Pass & Play Submit
  customWordSubmit.addEventListener("click", handlePassPlaySubmit);
  customWordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handlePassPlaySubmit();
    }
  });

  // Pass & Play Cancel
  passplayCancelBtn.addEventListener("click", () => {
    passplayDialog.close();
    if (passPlayCancelHandler) {
      passPlayCancelHandler();
    }
  });

  // Share Button Action
  shareBtn.addEventListener("click", () => {
    handleShareClick();
  });
}

// Generate Game Board dynamically based on mode
export function drawBoard(rows, cols, isDuo) {
  board.innerHTML = "";
  
  if (isDuo) {
    board.classList.add("duo-layout");
    
    // Create Board 1
    const board1 = document.createElement("div");
    board1.id = "board-1";
    board1.className = "sub-board";
    
    // Create Board 2
    const board2 = document.createElement("div");
    board2.id = "board-2";
    board2.className = "sub-board";
    
    // Draw cells
    for (let r = 0; r < rows; r++) {
      const row1 = document.createElement("div");
      row1.className = "row";
      row1.dataset.row = r;
      
      const row2 = document.createElement("div");
      row2.className = "row";
      row2.dataset.row = r;
      
      for (let c = 0; c < cols; c++) {
        const tile1 = document.createElement("div");
        tile1.className = "tile";
        tile1.dataset.idx = c;
        row1.appendChild(tile1);
        
        const tile2 = document.createElement("div");
        tile2.className = "tile";
        tile2.dataset.idx = c;
        row2.appendChild(tile2);
      }
      board1.appendChild(row1);
      board2.appendChild(row2);
    }
    
    board.appendChild(board1);
    board.appendChild(board2);
  } else {
    board.classList.remove("duo-layout");
    
    for (let r = 0; r < rows; r++) {
      const row = document.createElement("div");
      row.className = "row";
      row.dataset.row = r;
      
      for (let c = 0; c < cols; c++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.dataset.idx = c;
        row.appendChild(tile);
      }
      board.appendChild(row);
    }
  }
}

export function clearBoard() {
  // Board cells clearing is handled by dynamic drawBoard, but we clear keyboard classes
  const keys = keyboard.querySelectorAll(".key");
  keys.forEach(key => {
    key.className = "key";
    if (key.dataset.key === "enter" || key.dataset.key === "backspace") {
      key.classList.add("action-key");
    }
  });

  dictionaryCard.style.display = "none";
  pronunciationAudio = null;
}

export function updateTile(rowIdx, colIdx, letter, boardIdx = null) {
  let tileContainer = board;
  
  if (boardIdx !== null) {
    tileContainer = document.getElementById(`board-${boardIdx + 1}`);
  }
  if (!tileContainer) return;

  const row = tileContainer.querySelector(`[data-row="${rowIdx}"]`);
  if (!row) return;
  const tile = row.querySelector(`[data-idx="${colIdx}"]`);
  if (!tile) return;
  
  tile.textContent = letter;
  if (letter !== "") {
    tile.classList.add("active");
  } else {
    tile.classList.remove("active");
  }
}

export function shakeRow(rowIdx, boardIdx = null) {
  let tileContainer = board;
  if (boardIdx !== null) {
    tileContainer = document.getElementById(`board-${boardIdx + 1}`);
  }
  if (!tileContainer) return;

  const row = tileContainer.querySelector(`[data-row="${rowIdx}"]`);
  if (!row) return;
  
  row.classList.add("shake");
  row.addEventListener("animationend", () => {
    row.classList.remove("shake");
  }, { once: true });
}

export function revealRow(rowIdx, guess, evaluation, boardIdx = null) {
  let tileContainer = board;
  if (boardIdx !== null) {
    tileContainer = document.getElementById(`board-${boardIdx + 1}`);
  }
  if (!tileContainer) return;

  const row = tileContainer.querySelector(`[data-row="${rowIdx}"]`);
  if (!row) return;
  const tiles = row.querySelectorAll(".tile");
  
  evaluation.forEach((status, i) => {
    const tile = tiles[i];
    setTimeout(() => {
      tile.classList.remove("active");
      tile.classList.add(status);
    }, i * 50);
    
    // Update keyboard key states staggered
    const char = guess[i];
    const keyElement = keyboard.querySelector(`.key[data-key="${char}"]`);
    if (keyElement) {
      setTimeout(() => {
        // Keyboard update merges correct -> present -> absent
        if (status === 'correct') {
          keyElement.className = 'key correct';
        } else if (status === 'present' && !keyElement.classList.contains('correct')) {
          keyElement.className = 'key present';
        } else if (status === 'absent' && !keyElement.classList.contains('correct') && !keyElement.classList.contains('present')) {
          keyElement.className = 'key absent';
        }
      }, 600 + i * 150);
    }
  });
}

// HUD Rendering API
export function showTimerBar(show) {
  timerBar.style.display = show ? "flex" : "none";
}

export function updateTimer(secondsRemaining) {
  const mins = Math.floor(secondsRemaining / 60).toString().padStart(2, "0");
  const secs = (secondsRemaining % 60).toString().padStart(2, "0");
  gameTimer.textContent = `${mins}:${secs}`;
}

export function updateScore(score) {
  gameScore.textContent = score;
}

export function showClueBar(show, clueText = "") {
  clueBar.style.display = show ? "flex" : "none";
  if (show) {
    gameClue.textContent = clueText;
  }
}

export function updateModeTitle(title) {
  const formattedTitles = {
    unlimited: "Unlimited Mode",
    daily: "Daily Challenge",
    duo: "Duo Mode",
    time_attack: "Time Attack",
    clue: "Clue Mode",
    pass_play: "Pass & Play"
  };
  modeTitle.textContent = formattedTitles[title] || title;
  
  // Update Mode Dialog Active Highlighting
  const modeCards = modeDialog.querySelectorAll(".mode-card");
  modeCards.forEach(card => {
    if (card.dataset.mode === game.getGameMode()) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });
}

// Pass & Play Dialogs
export function showPassPlayModal() {
  customWordInput.value = "";
  passplayError.textContent = "";
  customWordInput.classList.add("masked-input");
  // Set default visibility icon to closed eye
  toggleWordVisibility.innerHTML = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  passplayDialog.showModal();
}

export function closePassPlayModal() {
  passplayDialog.close();
}

export function setPassPlayError(message) {
  passplayError.textContent = message;
  audio.playError();
}

function handlePassPlaySubmit() {
  const val = customWordInput.value.trim().toLowerCase();
  if (passPlaySubmitHandler) {
    passPlaySubmitHandler(val);
  }
}

// Toast Notifications
export function showToast(message, duration = 1800) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, duration);
}

// Statistics Modal Display
export function showStatsModal() {
  const currentMode = game.getGameMode();
  const stats = game.getStats();
  const guessesSubmitted = game.getGuesses().length;
  const status = game.getGameStatus();

  // Populate numeric metrics
  statPlayed.textContent = stats.played;
  
  const winPct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  statWinPct.textContent = winPct;
  
  statStreak.textContent = stats.currentStreak;
  statMaxStreak.textContent = stats.maxStreak;

  // Render guess distribution
  guessDistContainer.innerHTML = "";
  const maxAttempts = currentMode === "duo" ? 7 : 6;
  let maxCount = 0;
  for (let i = 1; i <= maxAttempts; i++) {
    maxCount = Math.max(maxCount, stats.guesses[i] || 0);
  }

  for (let i = 1; i <= maxAttempts; i++) {
    const count = stats.guesses[i] || 0;
    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
    
    const row = document.createElement("div");
    row.className = "chart-row";
    
    const num = document.createElement("span");
    num.className = "chart-num";
    num.textContent = i;
    
    const barContainer = document.createElement("div");
    barContainer.className = "chart-bar-container";
    
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.textContent = count;
    
    if (status === "WON" && guessesSubmitted === i) {
      bar.classList.add("highlight");
    }
    
    barContainer.appendChild(bar);
    row.appendChild(num);
    row.appendChild(barContainer);
    guessDistContainer.appendChild(row);
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        bar.style.width = `${pct}%`;
      }, 50);
    });
  }

  // Display Word Dictionary Card
  if (status === "WON" || status === "LOST") {
    // In duo mode, reveal both solutions
    if (currentMode === "duo") {
      const sol = game.getSolutionWord(); // returns array [sol1, sol2]
      displayWordInfo(game.getWordInfo(), sol.join(" & "));
    } else {
      displayWordInfo(game.getWordInfo(), game.getSolutionWord());
    }
    
    playAgainBtn.style.display = "block";
    // Show Share button for Daily Challenge
    shareBtn.style.display = currentMode === "daily" ? "block" : "none";
  } else {
    dictionaryCard.style.display = "none";
    playAgainBtn.style.display = "none";
    shareBtn.style.display = "none";
  }

  statsDialog.showModal();
}

function displayWordInfo(wordInfo, word) {
  if (!wordInfo) {
    dictWord.textContent = word;
    dictPhonetics.textContent = "Definitions unavailable";
    dictMeanings.innerHTML = "<p>Could not retrieve dictionary information for this word.</p>";
    pronounceAudioBtn.style.display = "none";
    dictionaryCard.style.display = "block";
    return;
  }

  dictWord.textContent = wordInfo.word || word;
  
  const phoneticsText = wordInfo.phonetics?.filter(p => p.text).map(p => p.text).join(", ") || "";
  dictPhonetics.textContent = phoneticsText;

  const audioUrl = wordInfo.phonetics?.find(p => p.audio && p.audio.trim() !== "")?.audio;
  if (audioUrl) {
    pronunciationAudio = new Audio(audioUrl);
    pronounceAudioBtn.style.display = "inline-flex";
  } else {
    pronunciationAudio = null;
    pronounceAudioBtn.style.display = "none";
  }

  dictMeanings.innerHTML = "";
  if (wordInfo.meanings && wordInfo.meanings.length > 0) {
    wordInfo.meanings.slice(0, 3).forEach(meaning => {
      const item = document.createElement("div");
      item.className = "dict-meaning-item";
      
      const pos = document.createElement("span");
      pos.className = "dict-pos";
      pos.textContent = meaning.partOfSpeech;
      
      const definition = document.createElement("span");
      definition.textContent = meaning.definitions[0]?.definition || "";
      
      item.appendChild(pos);
      item.appendChild(definition);
      dictMeanings.appendChild(item);
    });
  } else {
    dictMeanings.innerHTML = "<p>No definitions found.</p>";
  }

  dictionaryCard.style.display = "block";
}

export function showStartOverlay(mode, onStart) {
  const existing = board.querySelector(".board-overlay");
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement("div");
  overlay.className = "board-overlay";
  
  let title = "";
  let description = "";
  let btnText = "";
  
  if (mode === "time_attack") {
    title = "Time Attack";
    description = "Race against the clock! Solve as many words as you can. Solving a word adds +15 seconds to the timer.";
    btnText = "Start Race";
  } else if (mode === "pass_play") {
    title = "Pass & Play";
    description = "Local 2-player mode. Player 1 sets a secret 5-letter word, and Player 2 tries to guess it.";
    btnText = "Setup Secret Word";
  }
  
  overlay.innerHTML = `
    <h2 class="overlay-title">${title}</h2>
    <p class="overlay-desc">${description}</p>
    <button id="start-overlay-btn" class="btn primary-btn">${btnText}</button>
  `;
  
  board.appendChild(overlay);
  
  document.getElementById("start-overlay-btn").addEventListener("click", () => {
    overlay.remove();
    onStart();
  });
}

// Copy Grid Results to Clipboard
function handleShareClick() {
  const guesses = game.getGuesses();
  const sol = game.getSolutionWord();
  const maxAttempts = 6;
  const guessesSubmitted = guesses.length;
  const status = game.getGameStatus();
  
  const headerText = `WordGuess Daily ${status === "WON" ? guessesSubmitted : "X"}/${maxAttempts}\n`;
  let emojiBlock = "";

  guesses.forEach(guess => {
    const evaluation = game.evaluateGuess(guess);
    const rowEmojis = evaluation.map(status => {
      if (status === "correct") return "🟩";
      if (status === "present") return "🟨";
      return "⬛";
    }).join("");
    emojiBlock += rowEmojis + "\n";
  });

  const shareText = `${headerText}\n${emojiBlock}\nkitcjx.github.io/WordGuess/`;

  navigator.clipboard.writeText(shareText)
    .then(() => {
      showToast("Copied to clipboard!");
    })
    .catch(err => {
      console.error("Failed to copy share statistics", err);
      showToast("Sharing failed.");
    });
}

// Listeners Registry
export function registerModeSelectHandler(handler) {
  modeSelectHandler = handler;
}

export function registerPassPlaySubmitHandler(handler) {
  passPlaySubmitHandler = handler;
}

export function registerPassPlayCancelHandler(handler) {
  passPlayCancelHandler = handler;
}

export function attachPlayAgainHandler(handler) {
  playAgainBtn.addEventListener("click", () => {
    statsDialog.close();
    handler();
  });
}
