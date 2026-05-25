import * as game from './game.js';
import * as ui from './ui.js';

// Setup settings toggles, modal buttons, close buttons
ui.setupSettings();

// Keyboard input binding (physical keyboard)
window.addEventListener("keydown", (event) => {
  // Ignore inputs if user is focusing on an input fields or if dialog is open
  const activeDialog = document.querySelector("dialog[open]");
  if (activeDialog) return;

  const key = event.key;
  
  if (key === "Enter") {
    game.submitGuess();
  } else if (key === "Backspace") {
    game.removeLetter();
  } else if (/^[a-zA-Z]$/.test(key)) {
    game.addLetter(key);
  }
});

// Virtual keyboard binding (using event delegation)
const keyboard = document.getElementById("keyboard");
keyboard.addEventListener("click", (event) => {
  const btn = event.target.closest("button.key");
  if (!btn) return;

  const keyValue = btn.dataset.key;
  if (!keyValue) return;

  if (keyValue === "enter") {
    game.submitGuess();
  } else if (keyValue === "backspace") {
    game.removeLetter();
  } else {
    game.addLetter(keyValue);
  }
  
  // Remove focus so hitting spacebar later doesn't click the key again
  btn.blur();
});

// Play Again Hook
ui.attachPlayAgainHandler(() => {
  game.initializeGame();
});

// Developer cheat code
window.alohomora = () => {
  console.log(`%c[CHEAT ACTIVATED]%c The solution is: %c${game.getSolutionWord().toUpperCase()}`, "color: #16a34a; font-weight: bold;", "color: inherit;", "color: #eab308; font-weight: bold;");
};

// Start the game!
game.initializeGame();

