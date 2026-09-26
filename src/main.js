import confetti from 'canvas-confetti';
import { sound } from './audio.js';

// --- Pokémon Database ---
const STARTERS = {
  bulbasaur: { id: 1, name: 'Bulbasaur', type: 'grass', move: 'Vine Whip 🍃', color: '#10b981' },
  pikachu: { id: 25, name: 'Pikachu', type: 'electric', move: 'Thunderbolt ⚡', color: '#f59e0b' },
  charmander: { id: 4, name: 'Charmander', type: 'fire', move: 'Flamethrower 🔥', color: '#ef4444' },
  squirtle: { id: 7, name: 'Squirtle', type: 'water', move: 'Water Gun 💧', color: '#3b82f6' }
};

const WILD_POOL = [
  { id: 10, name: 'Caterpie', baseHp: 30 },
  { id: 16, name: 'Pidgey', baseHp: 35 },
  { id: 133, name: 'Eevee', baseHp: 50 },
  { id: 39, name: 'Jigglypuff', baseHp: 45 },
  { id: 54, name: 'Psyduck', baseHp: 40 },
  { id: 25, name: 'Pikachu', baseHp: 45 },
  { id: 1, name: 'Bulbasaur', baseHp: 50 },
  { id: 4, name: 'Charmander', baseHp: 50 },
  { id: 7, name: 'Squirtle', baseHp: 50 },
  { id: 143, name: 'Snorlax', baseHp: 80 },
  { id: 151, name: 'Mew', baseHp: 100 }
];

// --- Game State ---
const state = {
  currentStarter: 'bulbasaur',
  wild: null,
  wildHp: 50,
  maxHp: 50,
  isCatching: false,
  caughtDex: JSON.parse(localStorage.getItem('pokemon_caught') || '{}'),
  trainerExp: parseInt(localStorage.getItem('pokemon_exp') || '0', 10),
  level: 1,
  ball: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 32,
    isThrown: false,
    scale: 1,
    rotation: 0
  },
  particles: []
};

// --- DOM Elements ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const banner = document.getElementById('game-banner');
const bannerText = document.getElementById('banner-text');
const fxLayer = document.getElementById('fx-layer');
const caughtCountEl = document.getElementById('caught-count');
const expBarEl = document.getElementById('exp-bar');
const starterChips = document.querySelectorAll('.starter-chip');
const btnChooseYou = document.getElementById('btn-choose-you');
const btnNextWild = document.getElementById('btn-next-wild');
const btnSound = document.getElementById('btn-sound');
const soundIcon = document.getElementById('sound-icon');
const btnPokedex = document.getElementById('btn-pokedex');
const pokedexModal = document.getElementById('pokedex-modal');
const pokedexGrid = document.getElementById('pokedex-grid');
const btnClosePokedex = document.getElementById('btn-close-pokedex');

// Cache Sprite Images
const spriteCache = new Map();
function getSprite(id) {
  if (spriteCache.has(id)) return spriteCache.get(id);
  const img = new Image();
  img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  spriteCache.set(id, img);
  return img;
}

// Preload starters
Object.values(STARTERS).forEach(s => getSprite(s.id));
WILD_POOL.forEach(w => getSprite(w.id));

// --- Resize Canvas ---
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  resetBall();
}
window.addEventListener('resize', resizeCanvas);

function resetBall() {
  const rect = canvas.getBoundingClientRect();
  state.ball.x = rect.width / 2;
  state.ball.y = rect.height - 70;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.scale = 1;
  state.ball.rotation = 0;
  state.ball.isThrown = false;
}

// --- Spawn Wild Pokémon ---
function spawnWild(pokemon = null) {
  state.wild = pokemon || WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)];
  state.maxHp = state.wild.baseHp;
  state.wildHp = state.wild.baseHp;
  state.isCatching = false;
  resetBall();
  showBanner(`A wild ${state.wild.name} appeared! 🌿`);
}

function showBanner(text, duration = 2500) {
  bannerText.textContent = text;
  banner.classList.remove('hidden');
  clearTimeout(banner._timer);
  banner._timer = setTimeout(() => {
    banner.classList.add('hidden');
  }, duration);
}

function showFloatingFx(text, x, y, color = '#ffcb05') {
  const el = document.createElement('div');
  el.className = 'fx-text';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  fxLayer.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// --- Touch & Swipe Physics ---
let touchStart = null;

function handleStart(e) {
  if (state.ball.isThrown || state.isCatching) return;
  const pos = getPos(e);
  const dx = pos.x - state.ball.x;
  const dy = pos.y - state.ball.y;
  if (Math.hypot(dx, dy) <= state.ball.radius * 1.5) {
    touchStart = { x: pos.x, y: pos.y, time: Date.now() };
  }
}

function handleMove(e) {
  if (!touchStart || state.ball.isThrown || state.isCatching) return;
  const pos = getPos(e);
  state.ball.x = pos.x;
  state.ball.y = pos.y;
}

function handleEnd(e) {
  if (!touchStart || state.ball.isThrown || state.isCatching) return;
  const pos = getPos(e);
  const dt = Math.max((Date.now() - touchStart.time) / 1000, 0.05);
  const vx = (pos.x - touchStart.x) / dt * 0.4;
  const vy = (pos.y - touchStart.y) / dt * 0.4;

  if (vy < -150) { // Upward flick!
    state.ball.isThrown = true;
    state.ball.vx = Math.max(Math.min(vx, 300), -300);
    state.ball.vy = Math.max(vy, -900);
    sound.playThrow();
  } else {
    resetBall();
  }
  touchStart = null;
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? (e.touches[0] || e.changedTouches[0]).clientX : e.clientX;
  const clientY = e.touches ? (e.touches[0] || e.changedTouches[0]).clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

canvas.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

canvas.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd, { passive: false });

// --- "I Choose You!" Attack Action ---
btnChooseYou.addEventListener('click', () => {
  if (state.isCatching) return;
  const starter = STARTERS[state.currentStarter];
  sound.playMoveSound(state.currentStarter);

  const rect = canvas.getBoundingClientRect();
  const wildX = rect.width / 2;
  const wildY = rect.height * 0.38;

  // Weakens wild Pokémon
  const dmg = Math.floor(state.maxHp * 0.35);
  state.wildHp = Math.max(state.wildHp - dmg, 10);

  // Spawn visual elemental particles
  for (let i = 0; i < 25; i++) {
    state.particles.push({
      x: wildX,
      y: wildY,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      radius: Math.random() * 6 + 3,
      color: starter.color,
      life: 1
    });
  }

  showFloatingFx(starter.move, wildX - 50, wildY - 30, starter.color);
  showBanner(`${starter.name} used ${starter.move}!`);
});

// --- Next Wild Button ---
btnNextWild.addEventListener('click', () => {
  spawnWild();
});

// --- Starter Selector Chips ---
starterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    starterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.currentStarter = chip.dataset.pokemon;
    const starter = STARTERS[state.currentStarter];
    sound.playMoveSound(state.currentStarter);
    showBanner(`Partner switched to ${starter.name}! ✨`);
  });
});

// --- Sound Toggle ---
btnSound.addEventListener('click', () => {
  const on = sound.toggle();
  soundIcon.textContent = on ? '🔊' : '🔇';
});

// --- Pokédex Modal ---
btnPokedex.addEventListener('click', openPokedex);
btnClosePokedex.addEventListener('click', () => pokedexModal.classList.add('hidden'));

function openPokedex() {
  pokedexGrid.innerHTML = '';
  const entries = Object.entries(state.caughtDex);
  if (entries.length === 0) {
    pokedexGrid.innerHTML = `<div style="grid-column: span 3; text-align: center; color: #64748b; padding: 20px;">No Pokémon caught yet!<br>Swipe a Pokéball to catch one! ⭐</div>`;
  } else {
    entries.forEach(([id, item]) => {
      const card = document.createElement('div');
      card.className = 'pokedex-card';
      card.innerHTML = `
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt="${item.name}" />
        <span class="pokedex-card-name">${item.name}</span>
        <span class="pokedex-card-count">Caught: ${item.count}</span>
      `;
      pokedexGrid.appendChild(card);
    });
  }
  pokedexModal.classList.remove('hidden');
}

// --- Catch Sequence ---
function triggerCatch() {
  state.isCatching = true;
  sound.playHit();

  const rect = canvas.getBoundingClientRect();
  const wildX = rect.width / 2;
  const wildY = rect.height * 0.38;

  // Animate 3 shakes
  let wobble = 0;
  const wobbleInterval = setInterval(() => {
    wobble++;
    if (wobble <= 3) {
      sound.playWobble(wobble);
      state.ball.rotation = (wobble % 2 === 0 ? 0.35 : -0.35);
      setTimeout(() => { state.ball.rotation = 0; }, 200);
    } else {
      clearInterval(wobbleInterval);
      // Catch success!
      sound.playCatch();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 }
      });

      // Update Dex
      if (!state.caughtDex[state.wild.id]) {
        state.caughtDex[state.wild.id] = { name: state.wild.name, count: 0 };
      }
      state.caughtDex[state.wild.id].count++;
      localStorage.setItem('pokemon_caught', JSON.stringify(state.caughtDex));

      // Update EXP & Level
      state.trainerExp += 25;
      localStorage.setItem('pokemon_exp', state.trainerExp);
      updateHUD();

      showFloatingFx('CAUGHT! ⭐', wildX - 40, wildY - 40, '#ffcb05');
      showBanner(`Gotcha! ${state.wild.name} was caught! 🎉`, 3000);

      setTimeout(() => {
        spawnWild();
      }, 2500);
    }
  }, 700);
}

function updateHUD() {
  const totalCaught = Object.values(state.caughtDex).reduce((acc, v) => acc + v.count, 0);
  caughtCountEl.textContent = totalCaught;

  const expPct = Math.min((state.trainerExp % 100), 100);
  expBarEl.style.width = `${expPct}%`;

  const lvl = Math.floor(state.trainerExp / 100) + 1;
  document.querySelector('.trainer-level').textContent = `Trainer Lv. ${lvl}`;
}

// --- Game Loop (60 FPS) ---
let lastTime = performance.now();

function update(dt) {
  const rect = canvas.getBoundingClientRect();
  const wildX = rect.width / 2;
  const wildY = rect.height * 0.38;

  // Update particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt * 1.5;
    if (p.life <= 0) state.particles.splice(i, 1);
  }

  // Update thrown ball
  if (state.ball.isThrown && !state.isCatching) {
    state.ball.x += state.ball.vx * dt;
    state.ball.y += state.ball.vy * dt;
    state.ball.vy += 650 * dt; // Gravity
    state.ball.scale = Math.max(state.ball.scale - dt * 0.6, 0.55);
    state.ball.rotation += 10 * dt;

    // Check collision with wild Pokémon
    const dist = Math.hypot(state.ball.x - wildX, state.ball.y - wildY);
    if (dist < 60) {
      state.ball.x = wildX;
      state.ball.y = wildY + 20;
      triggerCatch();
    } else if (state.ball.y > rect.height + 50 || state.ball.x < -50 || state.ball.x > rect.width + 50) {
      // Missed!
      resetBall();
      showBanner('Missed! Try swiping higher! 🎯');
    }
  }
}

function render() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const wildX = rect.width / 2;
  const wildY = rect.height * 0.38;
  const time = performance.now() / 1000;

  // 1. Draw wild Pokémon (if not inside ball)
  if (state.wild && !state.isCatching) {
    // Soft shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(wildX, wildY + 65, 45, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bobbing bounce
    const bob = Math.sin(time * 3.5) * 6;
    const img = getSprite(state.wild.id);
    if (img && img.complete) {
      const size = 120;
      ctx.drawImage(img, wildX - size / 2, wildY - size / 2 + bob, size, size);
    }

    // Health / Capture indicator bar
    const barW = 80;
    const barH = 7;
    const hpPct = state.wildHp / state.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(wildX - barW / 2, wildY - 65, barW, barH);
    ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(wildX - barW / 2, wildY - 65, barW * hpPct, barH);
  }

  // 2. Draw Particles
  state.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 3. Draw Active Partner Pokémon in Bottom-Left Corner
  const starter = STARTERS[state.currentStarter];
  if (starter) {
    const partnerImg = getSprite(starter.id);
    if (partnerImg && partnerImg.complete) {
      const pSize = 75;
      const partnerBob = Math.sin(time * 4 + 1) * 3;
      ctx.drawImage(partnerImg, 15, rect.height - 110 + partnerBob, pSize, pSize);
    }
  }

  // 4. Draw Pokéball
  ctx.save();
  ctx.translate(state.ball.x, state.ball.y);
  ctx.rotate(state.ball.rotation);
  ctx.scale(state.ball.scale, state.ball.scale);
  drawPokeball(ctx, 0, 0, state.ball.radius);
  ctx.restore();
}

function drawPokeball(ctx, x, y, r) {
  // Ball Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(x, y + r + 4, r * 0.9, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red top half
  ctx.fillStyle = '#ee1515';
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();

  // White bottom half
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();

  // Black seam line
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = r * 0.16;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x + r, y);
  ctx.stroke();

  // Outer border
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // Center button outer
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Center button inner
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function gameLoop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

// --- Start Game ---
resizeCanvas();
updateHUD();
spawnWild();
requestAnimationFrame(gameLoop);
