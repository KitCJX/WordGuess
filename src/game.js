import * as api from './api.js';
import * as ui from './ui.js';

let solutionWord = "";
let wordInfo = null;
let guessesLeft = 6;
const maxTries = 6;

export function getSolutionWord() {
    return solutionWord;
}

export async function initializeGame() {
  ui.setGuessInput(false);
  const wordBank = await api.fetchWordBank();
  if (wordBank.length > 0) {
    solutionWord = wordBank[Math.floor(Math.random() * wordBank.length)].toLowerCase();
    wordInfo = await api.fetchWordInfo(solutionWord);
    guessesLeft = maxTries;
    ui.updateGuessesLeft(guessesLeft);
    ui.clearBoard();
    ui.showMessage("Start guessing...");
    ui.setGuessInput(true);
    ui.guessInput.focus();
  } else {
    ui.showMessage("Failed to load word bank.");
  }
}

export async function submitGuess() {
  ui.setGuessInput(false);

  const guess = ui.guessInput.value.toLowerCase().trim();
  if (guess.length === 5) {
    processGuess(guess);
    ui.guessInput.value = "";
    guessesLeft--;
    ui.updateGuessesLeft(guessesLeft);
    if (guessesLeft <= 0 || guess === solutionWord) {
      await endGame(guess === solutionWord);
    } else {
      ui.setGuessInput(true);
      ui.guessInput.focus();
    }
  } else {
    ui.showMessage("Please enter a 5-letter word.");
    ui.setGuessInput(true);
    ui.guessInput.focus();
  }
}

function processGuess(guess) {
  const evaluation = evaluateGuess(guess);
  ui.updateBoard(guess, evaluation);
}

export function evaluateGuess(guess) {
    const solutionLetterCount = {};
    for (const letter of solutionWord) {
        solutionLetterCount[letter] = (solutionLetterCount[letter] || 0) + 1;
    }

    const evaluation = new Array(5).fill('absent');

    // First pass for correct letters
    for (let i = 0; i < 5; i++) {
        if (guess[i] === solutionWord[i]) {
            evaluation[i] = 'correct';
            solutionLetterCount[guess[i]]--;
        }
    }

    // Second pass for present letters
    for (let i = 0; i < 5; i++) {
        if (guess[i] !== solutionWord[i] && solutionWord.includes(guess[i]) && solutionLetterCount[guess[i]] > 0) {
            evaluation[i] = 'present';
            solutionLetterCount[guess[i]]--;
        }
    }

    return evaluation;
}


async function endGame(win) {
  let message = win ? "Congratulations! You guessed the word!" : `You ran out of guesses. The word was: ${solutionWord}.`;
  ui.showMessage(message);
  ui.displayWordInfo(wordInfo);
  ui.setGuessInput(false);
  ui.showPlayAgain(true);
  ui.playAgainButton.focus();
}
