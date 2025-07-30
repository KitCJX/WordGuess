export const wordBoard = document.getElementById("word-board");
export const guessInput = document.getElementById("guess-input");
export const guessButton = document.getElementById("guess-button");
export const playAgainButton = document.getElementById("play-again-button");
const messageDiv = document.getElementById("message");
const wordInfoDiv = document.getElementById("word-info");
const guessesLeftSpan = document.getElementById("guesses-left");

export function showMessage(message) {
  messageDiv.textContent = message;
}

function scrollToBottom() {
  wordBoard.scrollTop = wordBoard.scrollHeight;
}

export function updateBoard(guess, evaluation) {
  const row = document.createElement("div");
  row.className = "guess-row";

  guess.split("").forEach((char, i) => {
    const tile = document.createElement("span");
    tile.className = "guess-tile";
    tile.textContent = char;
    tile.classList.add(evaluation[i]);
    row.appendChild(tile);
  });

  wordBoard.appendChild(row);
  scrollToBottom();
}

export function displayWordInfo(wordInfo) {
  wordInfoDiv.innerHTML = "";
  if (wordInfo) {
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
  } else {
    const errorPara = document.createElement("p");
    errorPara.textContent = "Could not retrieve word information.";
    wordInfoDiv.appendChild(errorPara);
  }
}

export function updateGuessesLeft(guesses) {
  guessesLeftSpan.textContent = guesses;
}

export function clearBoard() {
  wordBoard.innerHTML = "";
  messageDiv.innerHTML = "";
  wordInfoDiv.innerHTML = "";
}

export function setGuessInput(enabled) {
    guessInput.disabled = !enabled;
    guessButton.disabled = !enabled;
}

export function showPlayAgain(show) {
    playAgainButton.style.display = show ? "inline-block" : "none";
}

export function alohomora(solutionWord) {
  console.log(`The solution is: ${solutionWord}`);
}
