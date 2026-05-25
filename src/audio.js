let audioCtx = null;
let soundEnabled = true;

// Load initial preference from localStorage
try {
  const saved = localStorage.getItem("wordguess_sound_enabled");
  if (saved !== null) {
    soundEnabled = saved === "true";
  }
} catch (e) {
  console.error("Failed to read sound preference", e);
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  try {
    localStorage.setItem("wordguess_sound_enabled", enabled);
  } catch (e) {
    console.error("Failed to save sound preference", e);
  }
}

function playTone(freq, type, duration, volume = 0.1, delay = 0) {
  if (!soundEnabled) return;
  
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime + delay);
    // Linear decay to avoid clicks
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

export function playKey() {
  playTone(800, "triangle", 0.05, 0.05);
}

export function playDelete() {
  playTone(500, "triangle", 0.05, 0.05);
}

export function playError() {
  if (!soundEnabled) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.25);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

export function playFlip(index) {
  // Stagger sound matching the flip transition
  playTone(600 + (index * 50), "triangle", 0.08, 0.03, index * 0.15);
}

export function playWin() {
  if (!soundEnabled) return;
  try {
    initAudio();
    const now = audioCtx.currentTime;
    
    // Play a happy arpeggio: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      
      gainNode.gain.setValueAtTime(0.1, now + idx * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.6);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.6);
    });
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

export function playLose() {
  if (!soundEnabled) return;
  try {
    initAudio();
    const now = audioCtx.currentTime;
    
    // Sad slide down
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.6);
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(now + 0.6);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}
