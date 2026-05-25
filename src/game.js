import * as api from './api.js';
import * as ui from './ui.js';
import * as audio from './audio.js';

let solutionWord = "";
let wordInfo = null;
let guesses = []; // List of submitted 5-letter words
let currentGuess = ""; // Currently typed string
let gameStatus = "IN_PROGRESS"; // "IN_PROGRESS", "WON", "LOST"
let wordBank = [];
let allowedGuesses = [];

// Stats template
const defaultStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
};

let gameStats = { ...defaultStats };

// Load stats from localStorage
function loadStats() {
  try {
    const saved = localStorage.getItem("wordguess_stats");
    if (saved) {
      gameStats = JSON.parse(saved);
      // Ensure all fields exist
      gameStats.guesses = { ...defaultStats.guesses, ...gameStats.guesses };
    }
  } catch (e) {
    console.error("Failed to load statistics:", e);
  }
}

// Save stats to localStorage
function saveStats() {
  try {
    localStorage.setItem("wordguess_stats", JSON.stringify(gameStats));
  } catch (e) {
    console.error("Failed to save statistics:", e);
  }
}

export function getStats() {
  return gameStats;
}

export function getGuesses() {
  return guesses;
}

export function getCurrentGuess() {
  return currentGuess;
}

export function getGuessesLeft() {
  return 6 - guesses.length;
}

export function getSolutionWord() {
  return solutionWord;
}

export function getGameStatus() {
  return gameStatus;
}

export function getWordInfo() {
  return wordInfo;
}

export async function initializeGame() {
  currentGuess = "";
  guesses = [];
  gameStatus = "IN_PROGRESS";
  wordInfo = null;
  
  loadStats();
  
  // Load word lists
  wordBank = await api.fetchWordBank();
  allowedGuesses = await api.fetchAllowedGuesses();
  
  if (wordBank && wordBank.length > 0) {
    // Select solution
    solutionWord = wordBank[Math.floor(Math.random() * wordBank.length)].toLowerCase();
    
    // Lazy fetch word info in the background (so the game starts immediately)
    api.fetchWordInfo(solutionWord).then(info => {
      wordInfo = info;
    });

    // Reset board UI
    ui.clearBoard();
    ui.showToast("Find the secret word!");
  } else {
    ui.showToast("Error loading word bank.");
  }
}

export function addLetter(letter) {
  if (gameStatus !== "IN_PROGRESS") return;
  if (currentGuess.length >= 5) return;
  
  currentGuess += letter.toLowerCase();
  audio.playKey();
  ui.updateTile(guesses.length, currentGuess.length - 1, letter);
}

export function removeLetter() {
  if (gameStatus !== "IN_PROGRESS") return;
  if (currentGuess.length === 0) return;
  
  currentGuess = currentGuess.slice(0, -1);
  audio.playDelete();
  ui.updateTile(guesses.length, currentGuess.length, "");
}

export async function submitGuess() {
  if (gameStatus !== "IN_PROGRESS") return;

  const guess = currentGuess.trim().toLowerCase();
  
  // Validation 1: Word length
  if (guess.length !== 5) {
    audio.playError();
    ui.shakeRow(guesses.length);
    ui.showToast("Not enough letters");
    return;
  }

  // Validation 2: Exists in word lists
  if (!wordBank.includes(guess) && !allowedGuesses.includes(guess)) {
    audio.playError();
    ui.shakeRow(guesses.length);
    ui.showToast("Not in word list");
    return;
  }

  // Guess is valid! Process it
  guesses.push(guess);
  currentGuess = "";

  const evaluation = evaluateGuess(guess);
  
  // Play sequence sound & animate row flip in UI
  audio.playFlip(guesses.length - 1);
  ui.revealRow(guesses.length - 1, guess, evaluation);

  // Check Win / Lose
  if (guess === solutionWord) {
    gameStatus = "WON";
    updateStats(true, guesses.length);
    audio.playWin();
    
    const winMessages = ["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"];
    const msg = winMessages[guesses.length - 1] || "Congratulations!";
    
    setTimeout(() => {
      ui.showToast(msg);
      ui.showStatsModal();
    }, 1500);
    
  } else if (guesses.length === 6) {
    gameStatus = "LOST";
    updateStats(false);
    audio.playLose();
    
    setTimeout(() => {
      ui.showToast(solutionWord.toUpperCase(), 3000);
      ui.showStatsModal();
    }, 1500);
  }
}

export function evaluateGuess(guess) {
  const solutionLetterCount = {};
  for (const letter of solutionWord) {
    solutionLetterCount[letter] = (solutionLetterCount[letter] || 0) + 1;
  }

  const evaluation = new Array(5).fill('absent');

  // First pass: correct letters (green)
  for (let i = 0; i < 5; i++) {
    if (guess[i] === solutionWord[i]) {
      evaluation[i] = 'correct';
      solutionLetterCount[guess[i]]--;
    }
  }

  // Second pass: present letters (yellow)
  for (let i = 0; i < 5; i++) {
    if (evaluation[i] !== 'correct') {
      if (solutionWord.includes(guess[i]) && solutionLetterCount[guess[i]] > 0) {
        evaluation[i] = 'present';
        solutionLetterCount[guess[i]]--;
      }
    }
  }

  return evaluation;
}

function updateStats(win, guessCount) {
  gameStats.played++;
  if (win) {
    gameStats.won++;
    gameStats.currentStreak++;
    if (gameStats.currentStreak > gameStats.maxStreak) {
      gameStats.maxStreak = gameStats.currentStreak;
    }
    gameStats.guesses[guessCount] = (gameStats.guesses[guessCount] || 0) + 1;
  } else {
    gameStats.currentStreak = 0;
  }
  saveStats();
}

