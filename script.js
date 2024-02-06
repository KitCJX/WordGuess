const wordBoard = document.getElementById("word-board");
const guessInput = document.getElementById("guess-input");
const guessButton = document.getElementById("guess-button");
const messageDiv = document.getElementById("message");
const wordInfoDiv = document.getElementById("word-info");
const guessesLeftSpan = document.getElementById("guesses-left");

let solutionWord = "";
let guessesLeft = 6; // Initialize with the total number of allowed guesses
const maxTries = 6;
const wordBankUrl = "https://github.com/YimKTP/WordGuess/raw/main/wordBank.txt";

async function fetchWordBank() {
  const response = await fetch(wordBankUrl);
  const text = await response.text();
  return text
    .split("\n")
    .map((word) => word.trim())
    .filter((word) => word.length === 5);
}

async function selectRandomWord() {
  const wordBank = await fetchWordBank();
  solutionWord =
    wordBank[Math.floor(Math.random() * wordBank.length)].toLowerCase();
}

function showMessage(message) {
  messageDiv.textContent = message;
}

function scrollToBottom() {
  wordBoard.scrollTop = wordBoard.scrollHeight;
}

async function submitGuess() {
  const guess = guessInput.value.toLowerCase().trim();
  if (guess.length === 5) {
    processGuess(guess);
    guessInput.value = "";
    guessesLeft--;
    guessesLeftSpan.textContent = guessesLeft; // Update guesses left
    if (guessesLeft <= 0 || guess === solutionWord) {
      endGame(guess === solutionWord);
    }
  } else {
    showMessage("Please enter a 5-letter word.");
  }
}

function processGuess(guess) {
  updateBoard(guess, guess === solutionWord);
}

function updateBoard(guess, isCorrect) {
  const solutionLetterCount = {};
  for (const letter of solutionWord) {
    solutionLetterCount[letter] = (solutionLetterCount[letter] || 0) + 1;
  }

  const row = document.createElement("div");
  row.className = "guess-row";

  // First pass: Check for correct letters
  guess.split("").forEach((char, i) => {
    if (char === solutionWord[i]) {
      solutionLetterCount[char]--;
    }
  });

  // Second pass: Create tiles and mark them
  guess.split("").forEach((char, i) => {
    const tile = document.createElement("span");
    tile.className = "guess-tile";
    tile.textContent = char;

    if (isCorrect || char === solutionWord[i]) {
      tile.classList.add("correct");
    } else if (solutionWord.includes(char) && solutionLetterCount[char] > 0) {
      tile.classList.add("present");
      solutionLetterCount[char]--;
    }

    row.appendChild(tile);
  });

  wordBoard.appendChild(row);
  scrollToBottom();
}

async function endGame(win) {
  let message = win
    ? "Congratulations! You guessed the word!"
    : `You ran out of guesses. The word was: ${solutionWord}.`;
  showMessage(message); // Show the basic win/lose message

  // Clear previous word information
  const wordInfoDiv = document.getElementById("word-info");
  wordInfoDiv.innerHTML = "";

  // Fetch word information from the API
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${solutionWord}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Assuming data[0] contains the relevant word information
    const wordInfo = data[0];

    // Create and append phonetics information
    const phoneticsText = wordInfo.phonetics
      .map((phonetic) => phonetic.text || phonetic.audio)
      .join(", ");
    if (phoneticsText) {
      const phoneticsPara = document.createElement("p");
      phoneticsPara.textContent = `Phonetics: ${phoneticsText}`;
      phoneticsPara.style = "your-styles-here"; // Add your CSS styles
      wordInfoDiv.appendChild(phoneticsPara);
    }

    // Create and append meanings information
    wordInfo.meanings.forEach((meaning) => {
      const meaningPara = document.createElement("p");
      meaningPara.textContent = `${meaning.partOfSpeech}: ${meaning.definitions
        .map((def) => def.definition)
        .join(", ")}`;
      meaningPara.style = "your-styles-here"; // Add your CSS styles
      wordInfoDiv.appendChild(meaningPara);
    });
  } catch (error) {
    console.error("Failed to fetch word information:", error);
    const errorPara = document.createElement("p");
    errorPara.textContent = "Could not retrieve word information.";
    errorPara.style = "your-error-styles-here"; // Add your CSS styles for error
    wordInfoDiv.appendChild(errorPara);
  }

  // Optionally, disable the guess button to prevent further guesses
  guessButton.disabled = true;
}

async function initializeGame() {
  await selectRandomWord();
  guessButton.disabled = false;
  guessesLeft = maxTries; // Reset guesses left to the max tries
  guessesLeftSpan.textContent = guessesLeft; // Display initial guesses left
  wordBoard.innerHTML = "";
  showMessage("");
}

guessButton.addEventListener("click", submitGuess);
guessInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    submitGuess();
  }
});

function alohomora() {
  alert(`The solution is: ${solutionWord}`);
}

initializeGame();
