const wordBoard = document.getElementById("word-board");
const guessInput = document.getElementById("guess-input");
const guessButton = document.getElementById("guess-button");
const playAgainButton = document.getElementById("play-again-button");
const messageDiv = document.getElementById("message");
const wordInfoDiv = document.getElementById("word-info");
const guessesLeftSpan = document.getElementById("guesses-left");

let solutionWord = "";
let wordInfo = null;
let guessesLeft = 6;
const maxTries = 6;
const wordBankUrl = "https://raw.githubusercontent.com/KitCJX/WordGuess/main/wordBank.txt";

async function fetchWordBank() {
  try {
    const response = await fetch(wordBankUrl);
    const text = await response.text();
    return text.split("\n").map(word => word.trim()).filter(word => word.length === 5);
  } catch (error) {
    console.error("Failed to fetch word bank:", error);
    return [];
  }
}

async function selectRandomWord() {
  const wordBank = await fetchWordBank();
  if (wordBank.length > 0) {
    solutionWord = wordBank[Math.floor(Math.random() * wordBank.length)].toLowerCase();

    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${solutionWord}`;
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      wordInfo = data[0];
    } catch (error) {
      console.error("Failed to fetch word information:", error);
      wordInfo = null;
    }
  } else {
    showMessage("Failed to load word bank.");
  }
}

function showMessage(message) {
  messageDiv.textContent = message;
}

function scrollToBottom() {
  wordBoard.scrollTop = wordBoard.scrollHeight;
}

async function submitGuess() {
  guessButton.disabled = true;
  guessInput.disabled = true;

  const guess = guessInput.value.toLowerCase().trim();
  if (guess.length === 5) {
    processGuess(guess);
    guessInput.value = "";
    guessesLeft--;
    guessesLeftSpan.textContent = guessesLeft;
    if (guessesLeft <= 0 || guess === solutionWord) {
      await endGame(guess === solutionWord);
    } else {
      guessButton.disabled = false;
      guessInput.disabled = false;
    }
  } else {
    showMessage("Please enter a 5-letter word.");
    guessButton.disabled = false;
    guessInput.disabled = false;
  }

  guessInput.focus();
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

  guess.split("").forEach((char, i) => {
    if (char === solutionWord[i]) {
      solutionLetterCount[char]--;
    }
  });

  guess.split("").forEach((char, i) => {
    const tile = document.createElement("span");
    tile.className = "guess-tile";
    tile.textContent = char;

    if (isCorrect || char === solutionWord[i]) {
      tile.classList.add("correct");
    } else if (solutionWord.includes(char) && solutionLetterCount[char] > 0) {
      tile.classList.add("present");
      solutionLetterCount[char]--;
    } else {
      tile.classList.add("absent");
    }

    row.appendChild(tile);
  });

  wordBoard.appendChild(row);
  scrollToBottom();
}

async function endGame(win) {
  let message = win ? "Congratulations! You guessed the word!" : `You ran out of guesses. The word was: ${solutionWord}.`;
  showMessage(message);

  wordInfoDiv.innerHTML = "";
  if (wordInfo) {
    displayWordInfo(wordInfo);
  } else {
    const errorPara = document.createElement("p");
    errorPara.textContent = "Could not retrieve word information.";
    wordInfoDiv.appendChild(errorPara);
  }

  guessButton.disabled = true;
  guessInput.disabled = true;
  playAgainButton.style.display = "inline-block";
  playAgainButton.focus();
}

function displayWordInfo(wordInfo) {
  const phoneticsText = wordInfo.phonetics.filter(phonetic => phonetic.text).map(phonetic => phonetic.text).join(", ");
  if (phoneticsText) {
    const phoneticsPara = document.createElement("p");
    phoneticsPara.textContent = `Phonetics: ${phoneticsText}`;
    wordInfoDiv.appendChild(phoneticsPara);
  }

  const audioUrl = wordInfo.phonetics.find(phonetic => phonetic.audio)?.audio;
  if (audioUrl) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = audioUrl;
    wordInfoDiv.appendChild(audio);
  }

  wordInfo.meanings.forEach(meaning => {
    const meaningPara = document.createElement("p");
    meaningPara.textContent = `${meaning.partOfSpeech}: ${meaning.definitions.map(def => def.definition).join(", ")}`;
    wordInfoDiv.appendChild(meaningPara);
  });
}

async function initializeGame() {
  wordInfo = null;
  guessButton.disabled = true;
  guessInput.disabled = true;
  await selectRandomWord();
  guessButton.disabled = false;
  guessInput.disabled = false;
  guessesLeft = maxTries;
  guessesLeftSpan.textContent = guessesLeft;
  wordBoard.innerHTML = "";
  messageDiv.innerHTML = "";
  wordInfoDiv.innerHTML = "";
  showMessage("Start guessing...");
  guessInput.focus();
}

playAgainButton.addEventListener("click", function () {
  initializeGame();
  playAgainButton.style.display = "none";
});

guessButton.addEventListener("click", submitGuess);
guessInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    submitGuess();
  }
});

function alohomora() {
  console.log(`The solution is: ${solutionWord}`);
}

initializeGame();
