// The four colors and the sound each one makes
const colors = ["green", "red", "yellow", "blue"];
const notes = { green: 330, red: 262, yellow: 220, blue: 165 };

// Game state
let sequence = [];      // the pattern the computer made
let position = 0;       // where the player is in the pattern
let playing = false;
let canClick = false;
let best = 0;

// Try to load the best score (it can fail in some browsers, so we use try/catch)
try {
  best = parseInt(localStorage.getItem("simonBest")) || 0;
} catch (error) {}

// Page elements
const message = document.getElementById("message");
const board = document.getElementById("board");
const levelText = document.getElementById("level");
const bestText = document.getElementById("best");
const startButton = document.getElementById("start");

bestText.textContent = best;

// Sound
let audioCtx = null;

function beep(frequency, seconds) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "square";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + seconds);
}

// Light up a color and play its sound
function flash(color, milliseconds) {
  const pad = document.getElementById(color);
  pad.classList.add("lit");
  beep(notes[color], milliseconds / 1000);
  setTimeout(() => pad.classList.remove("lit"), milliseconds);
}

// Wait for some time (used between flashes)
function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// Show the whole pattern to the player
async function showPattern() {
  canClick = false;
  board.classList.add("off");
  message.textContent = "Watch...";
  await wait(600);

  // The pattern gets faster as it gets longer
  const speed = Math.max(250, 550 - sequence.length * 20);

  for (const color of sequence) {
    if (!playing) return;
    flash(color, speed);
    await wait(speed + 150);
  }

  position = 0;
  canClick = true;
  board.classList.remove("off");
  message.textContent = "Your turn!";
}

// Add one random color and show the pattern again
function nextRound() {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  sequence.push(randomColor);
  levelText.textContent = sequence.length;
  showPattern();
}

// Player clicked a wrong color
function gameOver() {
  playing = false;
  canClick = false;
  board.classList.add("off");
  beep(100, 0.6);

  const score = sequence.length - 1;

  if (score > best) {
    best = score;
    bestText.textContent = best;
    try {
      localStorage.setItem("simonBest", best);
    } catch (error) {}
    message.textContent = "Game over! New best: " + score;
  } else {
    message.textContent = "Game over! You got " + score;
  }

  startButton.textContent = "Play again";
}

// Player clicked a color
function pressColor(color) {
  if (!canClick) return;

  flash(color, 200);

  if (color !== sequence[position]) {
    gameOver();
    return;
  }

  position++;

  // Finished the whole pattern correctly
  if (position === sequence.length) {
    canClick = false;
    message.textContent = "Good job!";
    setTimeout(nextRound, 700);
  }
}

// Start button
startButton.addEventListener("click", () => {
  sequence = [];
  position = 0;
  playing = true;
  levelText.textContent = 0;
  nextRound();
});

// Color buttons
colors.forEach((color) => {
  document.getElementById(color).addEventListener("pointerdown", (event) => {
    event.preventDefault();
    pressColor(color);
  });
});