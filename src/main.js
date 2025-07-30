import * as game from './game.js';
import * as ui from './ui.js';

ui.playAgainButton.addEventListener("click", () => {
  game.initializeGame();
  ui.showPlayAgain(false);
});

ui.guessButton.addEventListener("click", game.submitGuess);
ui.guessInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    game.submitGuess();
  }
});

// Expose alohomora to the window for debugging
window.alohomora = () => {
    ui.alohomora(game.getSolutionWord());
}

game.initializeGame();
