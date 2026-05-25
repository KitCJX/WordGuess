const localWordBankUrl = "./wordBank.txt";
const fallbackWordBankUrl = "https://raw.githubusercontent.com/Kinkelin/WordleCompetition/main/data/official/shuffled_real_wordles.txt";

const localAllowedGuessesUrl = "./allowedGuesses.txt";
const fallbackAllowedGuessesUrl = "https://raw.githubusercontent.com/Kinkelin/WordleCompetition/main/data/official/official_allowed_guesses.txt";

let cachedWordBank = null;
let cachedAllowedGuesses = null;

// Fetches the list of possible daily solutions
export async function fetchWordBank() {
  if (cachedWordBank) return cachedWordBank;

  // Try local first
  try {
    const response = await fetch(localWordBankUrl);
    if (response.ok) {
      const text = await response.text();
      const words = parseWordList(text);
      if (words.length > 0) {
        cachedWordBank = words;
        return cachedWordBank;
      }
    }
  } catch (error) {
    console.warn("Local solutions fetch failed, trying remote fallback...", error);
  }

  // Fallback to github url
  try {
    const response = await fetch(fallbackWordBankUrl);
    if (response.ok) {
      const text = await response.text();
      const words = parseWordList(text);
      if (words.length > 0) {
        cachedWordBank = words;
        return cachedWordBank;
      }
    }
  } catch (error) {
    console.error("Failed to fetch solutions from remote fallback:", error);
  }

  // Hardcoded solution list if all network operations fail
  const basicFallback = ["apple", "beach", "cloud", "dance", "eagle", "fruit", "glass", "house", "light", "music", "night", "ocean", "paper", "queen", "river", "smile", "table", "under", "voice", "water", "youth", "zebra"];
  cachedWordBank = basicFallback;
  return cachedWordBank;
}

// Fetches the list of allowed guesses
export async function fetchAllowedGuesses() {
  if (cachedAllowedGuesses) return cachedAllowedGuesses;

  // Try local first
  try {
    const response = await fetch(localAllowedGuessesUrl);
    if (response.ok) {
      const text = await response.text();
      const words = parseWordList(text);
      if (words.length > 0) {
        cachedAllowedGuesses = words;
        return cachedAllowedGuesses;
      }
    }
  } catch (error) {
    console.warn("Local allowed guesses fetch failed, trying remote fallback...", error);
  }

  // Fallback to github url
  try {
    const response = await fetch(fallbackAllowedGuessesUrl);
    if (response.ok) {
      const text = await response.text();
      const words = parseWordList(text);
      if (words.length > 0) {
        cachedAllowedGuesses = words;
        return cachedAllowedGuesses;
      }
    }
  } catch (error) {
    console.error("Failed to fetch allowed guesses from remote fallback:", error);
  }

  cachedAllowedGuesses = [];
  return cachedAllowedGuesses;
}

function parseWordList(text) {
  return text
    .split("\n")
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length === 5 && /^[a-z]+$/.test(word));
}


export async function fetchWordInfo(word) {
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data[0];
  } catch (error) {
    console.error(`Failed to fetch word information for "${word}":`, error);
    return null;
  }
}

