const wordBoard = document.getElementById("word-board");
const guessInput = document.getElementById("guess-input");
const guessButton = document.getElementById("guess-button");
const messageDiv = document.getElementById("message");
const tryCountSpan = document.getElementById("try-count");

let solutionWord = "hello";
let guessCount = 0;

function showMessage(msg) {
  messageDiv.textContent = msg;
}

function submitGuess() {
  let guess = guessInput.value.toLowerCase().trim();
  if (guess.length === 5) {
    processGuess(guess);
    guessInput.value = "";
    guessCount++;
    tryCountSpan.textContent = guessCount;
  } else {
    showMessage("Please enter a 5-letter word");
  }
}

guessButton.addEventListener("click", () => {
  submitGuess();
});

guessInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    submitGuess();
  }
});

function processGuess(guess) {
  if (guess === solutionWord) {
    updateBoard(guess, true);
    endGame(true);
  } else {
    updateBoard(guess, false);
    showMessage("Your guess was: " + guess);
  }
}

function updateBoard(guess, isCorrect) {
  let solutionLetterCount = {};
  for (let letter of solutionWord) {
    solutionLetterCount[letter] = (solutionLetterCount[letter] || 0) + 1;
  }

  let row = document.createElement("div");
  row.className = "guess-row";

  // First pass: Check for correct letters
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === solutionWord[i]) {
      solutionLetterCount[guess[i]]--;
    }
  }

  // Second pass: Create tiles and mark them as correct or present
  for (let i = 0; i < guess.length; i++) {
    let tile = document.createElement("span");
    tile.className = "guess-tile";
    tile.textContent = guess[i];

    if (isCorrect) {
      tile.classList.add("correct");
    } else {
      if (guess[i] === solutionWord[i]) {
        tile.classList.add("correct");
      } else if (
        solutionWord.includes(guess[i]) &&
        solutionLetterCount[guess[i]] > 0
      ) {
        tile.classList.add("present");
        solutionLetterCount[guess[i]]--;
      }
    }

    row.appendChild(tile);
  }

  wordBoard.appendChild(row);
}

function endGame(win) {
  if (win) {
    showMessage("Congratulations! You guessed the word!");
  } else {
    showMessage("You ran out of guesses. The word was: " + solutionWord);
  }
  guessButton.disabled = true;
}
