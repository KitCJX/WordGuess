import * as game from './game.js';
import * as audio from './audio.js';

// DOM Elements
const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const toastContainer = document.getElementById("toast-container");

// Modals
const helpDialog = document.getElementById("help-dialog");
const statsDialog = document.getElementById("stats-dialog");
const settingsDialog = document.getElementById("settings-dialog");

// Action Buttons
const helpBtn = document.getElementById("help-btn");
const statsBtn = document.getElementById("stats-btn");
const settingsBtn = document.getElementById("settings-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const pronounceAudioBtn = document.getElementById("pronounce-audio-btn");

// Close buttons for dialogs
const closeBtns = document.querySelectorAll("dialog .close-btn");

// Settings Toggles
const soundToggle = document.getElementById("sound-toggle");
const themeToggle = document.getElementById("theme-toggle");
const colorblindToggle = document.getElementById("colorblind-toggle");

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

let pronunciationAudio = null;

// Initialize Toggle States from Settings
export function setupSettings() {
  // Theme Setup
  const isDark = !document.body.classList.contains("light-theme");
  themeToggle.checked = isDark;
  
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
    }
  });

  // Sound Setup
  soundToggle.checked = audio.isSoundEnabled();
  soundToggle.addEventListener("change", () => {
    audio.setSoundEnabled(soundToggle.checked);
  });

  // Colorblind Setup
  const isColorblind = document.body.classList.contains("colorblind-theme");
  colorblindToggle.checked = isColorblind;
  colorblindToggle.addEventListener("change", () => {
    if (colorblindToggle.checked) {
      document.body.classList.add("colorblind-theme");
    } else {
      document.body.classList.remove("colorblind-theme");
    }
  });

  // Dialog click listeners
  helpBtn.addEventListener("click", () => helpDialog.showModal());
  statsBtn.addEventListener("click", () => showStatsModal());
  settingsBtn.addEventListener("click", () => settingsDialog.showModal());
  
  closeBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.target.closest("dialog").close();
    });
  });

  // Close dialog on clicking backdrop
  [helpDialog, statsDialog, settingsDialog].forEach(dialog => {
    dialog.addEventListener("click", (e) => {
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

  // Pronounce audio button click
  pronounceAudioBtn.addEventListener("click", () => {
    if (pronunciationAudio) {
      pronunciationAudio.play().catch(err => console.log("Audio play blocked", err));
    }
  });
}

export function clearBoard() {
  // Clear Grid
  const tiles = board.querySelectorAll(".tile");
  tiles.forEach(tile => {
    tile.textContent = "";
    tile.className = "tile";
  });

  // Clear Keyboard classes
  const keys = keyboard.querySelectorAll(".key");
  keys.forEach(key => {
    key.className = "key";
    if (key.dataset.key === "enter" || key.dataset.key === "backspace") {
      key.classList.add("action-key");
    }
  });

  // Hide Game over assets
  dictionaryCard.style.display = "none";
  pronunciationAudio = null;
}

export function updateTile(rowIdx, colIdx, letter) {
  const row = board.querySelector(`[data-row="${rowIdx}"]`);
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

export function shakeRow(rowIdx) {
  const row = board.querySelector(`[data-row="${rowIdx}"]`);
  if (!row) return;
  
  row.classList.add("shake");
  row.addEventListener("animationend", () => {
    row.classList.remove("shake");
  }, { once: true });
}

export function revealRow(rowIdx, guess, evaluation) {
  const row = board.querySelector(`[data-row="${rowIdx}"]`);
  if (!row) return;
  const tiles = row.querySelectorAll(".tile");
  
  evaluation.forEach((status, i) => {
    const tile = tiles[i];
    // Queue flip animation classes
    setTimeout(() => {
      tile.classList.remove("active");
      tile.classList.add(status);
    }, i * 50); // Tiny layout trigger difference, major visual flip driven by CSS delays
    
    // Update keyboard states matching flip timing
    const char = guess[i];
    const keyElement = keyboard.querySelector(`.key[data-key="${char}"]`);
    if (keyElement) {
      setTimeout(() => {
        if (status === 'correct') {
          keyElement.classList.remove('present', 'absent');
          keyElement.classList.add('correct');
        } else if (status === 'present' && !keyElement.classList.contains('correct')) {
          keyElement.classList.remove('absent');
          keyElement.classList.add('present');
        } else if (status === 'absent' && !keyElement.classList.contains('correct') && !keyElement.classList.contains('present')) {
          keyElement.classList.add('absent');
        }
      }, 600 + i * 150); // Perfectly matches the 3D flip visual completion!
    }
  });
}

export function showToast(message, duration = 1800) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, duration);
}

export function showStatsModal() {
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
  let maxCount = 0;
  for (let i = 1; i <= 6; i++) {
    maxCount = Math.max(maxCount, stats.guesses[i] || 0);
  }

  for (let i = 1; i <= 6; i++) {
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
    
    // Highlight if this is the winning row of the current game
    if (status === "WON" && guessesSubmitted === i) {
      bar.classList.add("highlight");
    }
    
    barContainer.appendChild(bar);
    row.appendChild(num);
    row.appendChild(barContainer);
    guessDistContainer.appendChild(row);
    
    // Trigger animation frame for CSS transition width
    requestAnimationFrame(() => {
      setTimeout(() => {
        bar.style.width = `${pct}%`;
      }, 50);
    });
  }

  // Show dictionary meaning card if game is finished
  if (status === "WON" || status === "LOST") {
    displayWordInfo(game.getWordInfo(), game.getSolutionWord());
    playAgainBtn.style.display = "block";
  } else {
    dictionaryCard.style.display = "none";
    playAgainBtn.style.display = "none";
  }

  statsDialog.showModal();
}

function displayWordInfo(wordInfo, word) {
  if (!wordInfo) {
    dictWord.textContent = word;
    dictPhonetics.textContent = "Definition unavailable";
    dictMeanings.innerHTML = "<p>Could not retrieve dictionary information for this word.</p>";
    pronounceAudioBtn.style.display = "none";
    dictionaryCard.style.display = "block";
    return;
  }

  dictWord.textContent = wordInfo.word || word;
  
  // Find valid phonetic text representation
  const phoneticsText = wordInfo.phonetics?.filter(p => p.text).map(p => p.text).join(", ") || "";
  dictPhonetics.textContent = phoneticsText;

  // Sound pronunciation setup
  const audioUrl = wordInfo.phonetics?.find(p => p.audio && p.audio.trim() !== "")?.audio;
  if (audioUrl) {
    pronunciationAudio = new Audio(audioUrl);
    pronounceAudioBtn.style.display = "inline-flex";
  } else {
    pronunciationAudio = null;
    pronounceAudioBtn.style.display = "none";
  }

  // Meaning definitions
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

// Attach Stats play again handler
export function attachPlayAgainHandler(handler) {
  playAgainBtn.addEventListener("click", () => {
    statsDialog.close();
    handler();
  });
}

