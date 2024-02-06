# WordGuess Game

## Overview

WordGuess is a fun and interactive web-based game where players have the challenge of guessing a 5-letter word within 6 attempts. After each guess, the tiles will change colors to indicate how close the guess was to the word.

## Live Demo

Check out the game live [here](https://yimktp.github.io/WordGuess/).

## How to Play

- The game selects a random 5-letter word from a predefined list.
- Players have 6 attempts to guess the correct word.
- Each guess must be a valid 5-letter word. Hit the 'Guess' button or press 'Enter' to submit.
- After each guess, the color of the tiles will change to indicate:
  - **Green**: The letter is correct and in the right position.
  - **Yellow**: The letter is correct but in the wrong position.
  - **Gray**: The letter is not in the word in any position.

## Features

- Responsive design for desktop and mobile devices.
- Real-time feedback on guesses.
- Display of remaining guesses.
- End-of-game message with the correct word and an option to restart.

## Technical Details

- The game is built using HTML, CSS, and JavaScript.
- Word list fetched from an external [wordBank.txt](https://raw.githubusercontent.com/YimKTP/WordGuess/main/wordBank.txt) file hosted on GitHub.
- Utilizes `fetch` API to dynamically load the word list and select a random word each game session.
- Implements basic DOM manipulation for dynamic content updates.

## Setup and Run Locally

1. Clone the repository to your local machine.
2. Open the `index.html` file in a web browser to start the game.

## Contributions

Contributions are welcome! If you'd like to contribute, feel free to fork the repository and submit a pull request.
