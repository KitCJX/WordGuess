import * as api from './api.js';
import * as ui from './ui.js';
import * as audio from './audio.js';

// State Variables
let gameMode = "daily"; // "unlimited", "daily", "duo", "time_attack", "clue", "pass_play"
let previousGameMode = "daily";
let hardMode = false;
let gameStatus = "IN_PROGRESS"; // "IN_PROGRESS", "WON", "LOST"

// Dictionary and solutions
let solutionWord = "";
let wordInfo = null;
let wordBank = [];
let allowedGuesses = [];

// Duo Mode Specifics
let solutionWord1 = "";
let solutionWord2 = "";
let wordInfo1 = null;
let wordInfo2 = null;
let board1Solved = false;
let board2Solved = false;

// Time Attack Specifics
let timeLeft = 120;
let timeScore = 0;
let timeInterval = null;

// Guess tracking
let guesses = []; // List of submitted 5-letter words
let currentGuess = ""; // Currently typed string

// Stats template
const defaultStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  highScore: 0, // Used for Time Attack
  guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }
};

let gameStats = { ...defaultStats };

// Mulberry32 seeded random number generator
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

// Load statistics for current mode
function loadStats() {
  const key = `wordguess_stats_${gameMode}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      gameStats = JSON.parse(saved);
      // Ensure all fields exist
      gameStats.guesses = { ...defaultStats.guesses, ...gameStats.guesses };
      if (gameStats.highScore === undefined) gameStats.highScore = 0;
    } else {
      gameStats = { ...defaultStats };
      // Duplicate values to break referencing
      gameStats.guesses = { ...defaultStats.guesses };
    }
  } catch (e) {
    console.error("Failed to load statistics:", e);
  }
}

// Save statistics for current mode
function saveStats() {
  const key = `wordguess_stats_${gameMode}`;
  try {
    localStorage.setItem(key, JSON.stringify(gameStats));
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

export function getSolutionWord() {
  if (gameMode === "duo") {
    return [solutionWord1, solutionWord2];
  }
  return solutionWord;
}

export function getGameStatus() {
  return gameStatus;
}

export function getGameMode() {
  return gameMode;
}

export function getWordInfo() {
  if (gameMode === "duo") {
    return wordInfo1 || wordInfo2; // Combine or pick one
  }
  return wordInfo;
}

export async function initializeGame(newMode = null) {
  if (newMode) {
    if (newMode !== "pass_play") {
      previousGameMode = gameMode;
    }
    gameMode = newMode;
  }
  
  // Cleanup timers
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
  
  // Reset Core States
  currentGuess = "";
  guesses = [];
  gameStatus = "IN_PROGRESS";
  wordInfo = null;
  board1Solved = false;
  board2Solved = false;
  timeScore = 0;
  
  loadStats();
  ui.clearBoard();
  ui.updateModeTitle(gameMode);
  
  // Fetch word lists
  wordBank = await api.fetchWordBank();
  allowedGuesses = await api.fetchAllowedGuesses();
  
  if (!wordBank || wordBank.length === 0) {
    ui.showToast("Error loading word lists.");
    return;
  }

  // Set up HUD elements
  ui.showTimerBar(gameMode === "time_attack");
  ui.showClueBar(false);

  // Setup mode specific target words
  if (gameMode === "daily") {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const rand = mulberry32(seed);
    const dailyWordIdx = Math.floor(rand() * wordBank.length);
    solutionWord = wordBank[dailyWordIdx].toLowerCase();
    
    // Fetch info
    api.fetchWordInfo(solutionWord).then(info => {
      wordInfo = info;
    });
    
    // Draw 6x5 Board
    ui.drawBoard(6, 5, false);
    ui.showToast("Today's Daily Challenge!");
    
  } else if (gameMode === "duo") {
    // Select 2 words
    solutionWord1 = wordBank[Math.floor(Math.random() * wordBank.length)].toLowerCase();
    let secondIdx = Math.floor(Math.random() * wordBank.length);
    solutionWord2 = wordBank[secondIdx].toLowerCase();
    
    // Ensure solutions are different
    while (solutionWord1 === solutionWord2) {
      secondIdx = Math.floor(Math.random() * wordBank.length);
      solutionWord2 = wordBank[secondIdx].toLowerCase();
    }
    
    api.fetchWordInfo(solutionWord1).then(info => {
      wordInfo1 = info;
    });
    api.fetchWordInfo(solutionWord2).then(info => {
      wordInfo2 = info;
    });
    
    // Draw Parallel boards: 7 rows, 5 cols
    ui.drawBoard(7, 5, true);
    ui.showToast("Duo Mode: Solve 2 words!");
    
  } else if (gameMode === "time_attack") {
    timeScore = 0;
    ui.updateScore(timeScore);
    ui.drawBoard(6, 5, false);
    
    ui.showStartOverlay("time_attack", () => {
      timeLeft = 120; // 2 minutes
      ui.updateTimer(timeLeft);
      selectNextTimeAttackWord();
      startTimeAttackCountdown();
      ui.showToast("Speed Round: Go!");
    });
    
  } else if (gameMode === "clue") {
    solutionWord = wordBank[Math.floor(Math.random() * wordBank.length)].toLowerCase();
    ui.drawBoard(6, 5, false);
    ui.showToast("Fetching definition clue...");
    
    try {
      const info = await api.fetchWordInfo(solutionWord);
      wordInfo = info;
      const def = info?.meanings?.[0]?.definitions?.[0]?.definition;
      if (def) {
        ui.showClueBar(true, def);
      } else {
        ui.showClueBar(true, "Clue: Definition unavailable for this word.");
      }
    } catch (e) {
      ui.showClueBar(true, "Clue: Dictionary lookup failed.");
    }
    
  } else if (gameMode === "pass_play") {
    ui.drawBoard(6, 5, false);
    ui.showStartOverlay("pass_play", () => {
      ui.showPassPlayModal();
    });
    
  } else {
    // Unlimited Mode
    solutionWord = wordBank[Math.floor(Math.random() * wordBank.length)].toLowerCase();
    
    api.fetchWordInfo(solutionWord).then(info => {
      wordInfo = info;
    });
    
    ui.drawBoard(6, 5, false);
    ui.showToast("Find the secret word!");
  }
}

// Pass & Play Custom Word Launcher
export function setupPassPlayWord(word) {
  if (word.length !== 5) {
    ui.setPassPlayError("Word must be exactly 5 letters.");
    return;
  }
  if (!/^[a-z]+$/.test(word)) {
    ui.setPassPlayError("Letters only.");
    return;
  }
  if (!wordBank.includes(word) && !allowedGuesses.includes(word)) {
    ui.setPassPlayError("Not in dictionary list.");
    return;
  }

  // Word is valid!
  solutionWord = word;
  api.fetchWordInfo(solutionWord).then(info => {
    wordInfo = info;
  });

  ui.closePassPlayModal();
  ui.showToast("Player 2: Guess the word!");
}

// Time Attack Helper
function selectNextTimeAttackWord() {
  solutionWord = wordBank[Math.floor(Math.random() * wordBank.length)].toLowerCase();
  api.fetchWordInfo(solutionWord).then(info => {
    wordInfo = info;
  });
}

function startTimeAttackCountdown() {
  timeInterval = setInterval(() => {
    timeLeft--;
    ui.updateTimer(timeLeft);
    
    if (timeLeft <= 0) {
      clearInterval(timeInterval);
      timeInterval = null;
      gameStatus = "LOST";
      updateStats(false);
      audio.playLose();
      
      setTimeout(() => {
        ui.showToast(`Time's up! Secret was: ${solutionWord.toUpperCase()}`, 3000);
        ui.showStatsModal();
      }, 1500);
    }
  }, 1000);
}

// Inputs
export function addLetter(letter) {
  if (gameStatus !== "IN_PROGRESS") return;
  if (currentGuess.length >= 5) return;
  
  currentGuess += letter.toLowerCase();
  audio.playKey();
  
  if (gameMode === "duo") {
    // Populate letters on Board 1 if unsolved
    if (!board1Solved) {
      ui.updateTile(guesses.length, currentGuess.length - 1, letter, 0);
    }
    // Populate letters on Board 2 if unsolved
    if (!board2Solved) {
      ui.updateTile(guesses.length, currentGuess.length - 1, letter, 1);
    }
  } else {
    ui.updateTile(guesses.length, currentGuess.length - 1, letter);
  }
}

export function removeLetter() {
  if (gameStatus !== "IN_PROGRESS") return;
  if (currentGuess.length === 0) return;
  
  currentGuess = currentGuess.slice(0, -1);
  audio.playDelete();
  
  if (gameMode === "duo") {
    if (!board1Solved) {
      ui.updateTile(guesses.length, currentGuess.length, "", 0);
    }
    if (!board2Solved) {
      ui.updateTile(guesses.length, currentGuess.length, "", 1);
    }
  } else {
    ui.updateTile(guesses.length, currentGuess.length, "");
  }
}

function getOrdinal(n) {
  const ordinals = ["1st", "2nd", "3rd", "4th", "5th"];
  return ordinals[n] || `${n + 1}th`;
}

function getBoardConstraints(solution, guessList) {
  const greens = Array(5).fill(null);
  const yellows = new Set();
  
  guessList.forEach(g => {
    const evalResult = evaluateGuess(g, solution);
    evalResult.forEach((status, idx) => {
      if (status === "correct") {
        greens[idx] = g[idx];
      } else if (status === "present") {
        yellows.add(g[idx]);
      }
    });
  });
  return { greens, yellows };
}

function validateGuessAgainstConstraints(guess, constraints) {
  const { greens, yellows } = constraints;
  
  // 1. Check greens
  for (let i = 0; i < 5; i++) {
    if (greens[i] !== null && guess[i] !== greens[i]) {
      return {
        valid: false,
        message: `${getOrdinal(i)} letter must be ${greens[i].toUpperCase()}`
      };
    }
  }
  
  // 2. Check yellows
  for (const char of yellows) {
    if (!guess.includes(char)) {
      return {
        valid: false,
        message: `Must contain ${char.toUpperCase()}`
      };
    }
  }
  
  return { valid: true };
}

export async function submitGuess() {
  if (gameStatus !== "IN_PROGRESS") return;

  const guess = currentGuess.trim().toLowerCase();
  
  // Validation 1: Word length
  if (guess.length !== 5) {
    audio.playError();
    if (gameMode === "duo") {
      if (!board1Solved) ui.shakeRow(guesses.length, 0);
      if (!board2Solved) ui.shakeRow(guesses.length, 1);
    } else {
      ui.shakeRow(guesses.length);
    }
    ui.showToast("Not enough letters");
    return;
  }

  // Validation 2: Dictionary inclusion
  if (!wordBank.includes(guess) && !allowedGuesses.includes(guess)) {
    audio.playError();
    if (gameMode === "duo") {
      if (!board1Solved) ui.shakeRow(guesses.length, 0);
      if (!board2Solved) ui.shakeRow(guesses.length, 1);
    } else {
      ui.shakeRow(guesses.length);
    }
    ui.showToast("Not in word list");
    return;
  }

  // Validation 3: Hard Mode hints constraint
  if (hardMode && guesses.length > 0) {
    if (gameMode === "duo") {
      let b1Valid = false;
      let b1Msg = "";
      let b2Valid = false;
      let b2Msg = "";
      
      if (!board1Solved) {
        const constraints = getBoardConstraints(solutionWord1, guesses);
        const validation = validateGuessAgainstConstraints(guess, constraints);
        b1Valid = validation.valid;
        b1Msg = validation.message;
      }
      
      if (!board2Solved) {
        const constraints = getBoardConstraints(solutionWord2, guesses);
        const validation = validateGuessAgainstConstraints(guess, constraints);
        b2Valid = validation.valid;
        b2Msg = validation.message;
      }
      
      // Reject if it fails on BOTH unsolved boards
      if (!b1Valid && !b2Valid) {
        audio.playError();
        if (!board1Solved) ui.shakeRow(guesses.length, 0);
        if (!board2Solved) ui.shakeRow(guesses.length, 1);
        ui.showToast(b1Msg || b2Msg || "Must satisfy hints");
        return;
      }
    } else {
      const constraints = getBoardConstraints(solutionWord, guesses);
      const validation = validateGuessAgainstConstraints(guess, constraints);
      if (!validation.valid) {
        audio.playError();
        ui.shakeRow(guesses.length);
        ui.showToast(validation.message);
        return;
      }
    }
  }

  guesses.push(guess);
  currentGuess = "";

  if (gameMode === "duo") {
    // Process Duo Mode parallel evaluations
    processDuoGuess(guess);
  } else if (gameMode === "time_attack") {
    // Process Time Attack speed evaluations
    processTimeAttackGuess(guess);
  } else {
    // Process Unlimited, Daily, Clue, Pass & Play
    processUnlimitedGuess(guess);
  }
}

function processUnlimitedGuess(guess) {
  const evaluation = evaluateGuess(guess, solutionWord);
  
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

function processDuoGuess(guess) {
  // Solve evaluation on both boards independently
  let eval1 = null;
  let eval2 = null;

  if (!board1Solved) {
    eval1 = evaluateGuess(guess, solutionWord1);
    ui.revealRow(guesses.length - 1, guess, eval1, 0);
    if (guess === solutionWord1) {
      board1Solved = true;
    }
  }

  if (!board2Solved) {
    eval2 = evaluateGuess(guess, solutionWord2);
    ui.revealRow(guesses.length - 1, guess, eval2, 1);
    if (guess === solutionWord2) {
      board2Solved = true;
    }
  }

  audio.playFlip(guesses.length - 1);

  // Evaluate Win / Lose conditions for Duo Mode
  if (board1Solved && board2Solved) {
    gameStatus = "WON";
    updateStats(true, guesses.length);
    audio.playWin();
    
    setTimeout(() => {
      ui.showToast("Superb!");
      ui.showStatsModal();
    }, 1500);
    
  } else if (guesses.length === 7) {
    gameStatus = "LOST";
    updateStats(false);
    audio.playLose();
    
    setTimeout(() => {
      const missing = [];
      if (!board1Solved) missing.push(solutionWord1.toUpperCase());
      if (!board2Solved) missing.push(solutionWord2.toUpperCase());
      ui.showToast(`Solutions: ${missing.join(" & ")}`, 3500);
      ui.showStatsModal();
    }, 1500);
  }
}

function processTimeAttackGuess(guess) {
  const evaluation = evaluateGuess(guess, solutionWord);
  
  audio.playFlip(guesses.length - 1);
  ui.revealRow(guesses.length - 1, guess, evaluation);

  if (guess === solutionWord) {
    // Correct! Add score, increment time, reset board for next word
    timeScore++;
    ui.updateScore(timeScore);
    
    timeLeft = Math.min(300, timeLeft + 15); // Add 15s, cap at 5 mins
    ui.updateTimer(timeLeft);
    audio.playWin();
    ui.showToast("+15s");

    setTimeout(() => {
      // Clear board, reset guesses lists, pick new word
      guesses = [];
      currentGuess = "";
      selectNextTimeAttackWord();
      ui.clearBoard();
    }, 1200);
    
  } else if (guesses.length === 6) {
    // Out of guesses on this word - treat as loss for this run
    clearInterval(timeInterval);
    timeInterval = null;
    gameStatus = "LOST";
    updateStats(false);
    audio.playLose();
    
    setTimeout(() => {
      ui.showToast(`Game Over! Secret: ${solutionWord.toUpperCase()}`, 3000);
      ui.showStatsModal();
    }, 1500);
  }
}

// Letter evaluations matching Wordle rules
export function evaluateGuess(guess, solution) {
  const solutionLetterCount = {};
  for (const letter of solution) {
    solutionLetterCount[letter] = (solutionLetterCount[letter] || 0) + 1;
  }

  const evaluation = new Array(5).fill('absent');

  // First pass: exact matches (green)
  for (let i = 0; i < 5; i++) {
    if (guess[i] === solution[i]) {
      evaluation[i] = 'correct';
      solutionLetterCount[guess[i]]--;
    }
  }

  // Second pass: present matches (yellow)
  for (let i = 0; i < 5; i++) {
    if (evaluation[i] !== 'correct') {
      if (solution.includes(guess[i]) && solutionLetterCount[guess[i]] > 0) {
        evaluation[i] = 'present';
        solutionLetterCount[guess[i]]--;
      }
    }
  }

  return evaluation;
}

function updateStats(win, guessCount) {
  gameStats.played++;
  
  if (gameMode === "time_attack") {
    // Time Attack records highscore instead of streaks
    if (timeScore > gameStats.highScore) {
      gameStats.highScore = timeScore;
    }
    // Record current score
    gameStats.won = timeScore; // temporary store
  } else {
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
  }
  
  saveStats();
}

export function cancelPassPlay() {
  initializeGame(previousGameMode);
}

export function setHardMode(enabled) {
  hardMode = enabled;
}

export function isHardMode() {
  return hardMode;
}
