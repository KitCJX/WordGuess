const wordBankUrl = "https://raw.githubusercontent.com/KitCJX/WordGuess/main/wordBank.txt";

export async function fetchWordBank() {
  try {
    const response = await fetch(wordBankUrl);
    const text = await response.text();
    return text.split("\n").map(word => word.trim()).filter(word => word.length === 5);
  } catch (error) {
    console.error("Failed to fetch word bank:", error);
    return [];
  }
}

export async function fetchWordInfo(word) {
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data[0];
  } catch (error) {
    console.error("Failed to fetch word information:", error);
    return null;
  }
}
