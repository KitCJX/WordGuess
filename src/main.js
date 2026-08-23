import * as game from './game.js';
import * as ui from './ui.js';

// Register the offline app shell. Relative URLs keep the scope valid on GitHub Pages.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
      .catch(error => {
        console.error("Service worker registration failed:", error);
      });
  });
}

// Setup settings toggles, modal buttons, and close buttons
ui.setupSettings();

// Register game mode selection routing
ui.registerModeSelectHandler((newMode) => {
  game.initializeGame(newMode);
});

// Register Pass & Play custom word submission
ui.registerPassPlaySubmitHandler((customWord) => {
  game.setupPassPlayWord(customWord);
});

// Register Pass & Play cancellation
ui.registerPassPlayCancelHandler(() => {
  game.cancelPassPlay();
});

// Keyboard input binding (physical keyboard)
window.addEventListener("keydown", (event) => {
  // Ignore inputs if a dialog or start overlay is open (e.g. settings, help, modes, or start screens)
  const activeDialog = document.querySelector("dialog[open]");
  const startOverlay = document.querySelector(".board-overlay");
  if (activeDialog || startOverlay) return;

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
  // Ignore inputs if start overlay is open
  const startOverlay = document.querySelector(".board-overlay");
  if (startOverlay) return;

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
  game.initializeGame(null, { forceNew: true });
});

// Developer cheat code
window.alohomora = () => {
  const sol = game.getSolutionWord();
  const solText = Array.isArray(sol) ? sol.join(" & ") : sol;
  console.log(`%c[CHEAT ACTIVATED]%c The solution is: %c${solText.toUpperCase()}`, "color: #16a34a; font-weight: bold;", "color: inherit;", "color: #eab308; font-weight: bold;");
};

// Start the game! (Daily Challenge by default)
game.initializeGame("daily");
