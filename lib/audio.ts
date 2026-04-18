/**
 * Premium Sound Engine for Imposter Game
 * Uses a hybrid approach:
 * 1. Web Audio API (Synth) for low-latency UI interactions.
 * 2. External Audio Assets for cinematic moments.
 */

type SoundType = "TAP" | "REVEAL" | "VOTE" | "WINNER" | "ALERT";

let audioCtx: AudioContext | null = null;

/**
 * Initializes the Audio Context. 
 * Browsers require a user interaction to start audio.
 */
function initAudio() {
  if (!audioCtx && typeof window !== "undefined") {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
}

/**
 * Generates a clean UI click/tap sound using oscillator. (0ms latency)
 */
function synthTap() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

/**
 * Generates a deep thump for voting.
 */
function synthThump() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

const EXTERNAL_SOUNDS: Record<string, string> = {
  REVEAL: "https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-reveal-915.mp3",
  WINNER: "https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3",
  ALERT: "https://assets.mixkit.co/sfx/preview/mixkit-system-error-buzz-2857.mp3",
};

/**
 * Main function to trigger sounds throughout the game.
 */
export function playGameSound(type: SoundType) {
  if (typeof window === "undefined") return;
  
  initAudio();

  // Handle Synth sounds
  if (type === "TAP") {
    synthTap();
    return;
  }
  if (type === "VOTE") {
    synthThump();
    return;
  }

  // Handle Asset sounds
  const url = EXTERNAL_SOUNDS[type];
  if (url) {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(err => console.warn("[audio] Blocked by browser:", err));
  }
}

/**
 * Refined Vibration Patterns
 */
export const HAPTICS = {
  TAP: 15,
  VOTE: 40,
  REVEAL: [100, 30, 100, 30, 250],
  WINNER: [50, 50, 50, 50, 300],
  ALERT: [200, 100, 200],
};

/**
 * Utility to vibrate with safety check
 */
export function triggerHaptic(pattern: number | number[]) {
  if (typeof window !== "undefined" && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
}
