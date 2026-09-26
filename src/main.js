import confetti from 'canvas-confetti';
import { sound } from './audio.js';

// --- DATA DEFINITIONS ---
const STARTERS = {
  bulbasaur: { id: 1, name: 'Bulbasaur', move: 'Vine Whip 🍃', color: '#10b981', baseAtk: 22 },
  pikachu: { id: 25, name: 'Pikachu', move: 'Thunderbolt ⚡', color: '#f59e0b', baseAtk: 25 },
  charmander: { id: 4, name: 'Charmander', move: 'Flamethrower 🔥', color: '#ef4444', baseAtk: 24 },
  squirtle: { id: 7, name: 'Squirtle', move: 'Water Gun 💧', color: '#3b82f6', baseAtk: 20 }
};

const WILD_POOL = [
  { id: 10, name: 'Caterpie', maxHp: 35, atk: 8 },
  { id: 16, name: 'Pidgey', maxHp: 40, atk: 10 },
  { id: 133, name: 'Eevee', maxHp: 55, atk: 14 },
  { id: 39, name: 'Jigglypuff', maxHp: 50, atk: 12 },
  { id: 54, name: 'Psyduck', maxHp: 45, atk: 11 },
  { id: 143, name: 'Snorlax', maxHp: 85, atk: 18 },
  { id: 151, name: 'Mew', maxHp: 90, atk: 20 },
  { id: 1, name: 'Bulbasaur', maxHp: 50, atk: 15 },
  { id: 25, name: 'Pikachu', maxHp: 50, atk: 16 },
  { id: 4, name: 'Charmander', maxHp: 50, atk: 16 },
  { id: 7, name: 'Squirtle', maxHp: 50, atk: 15 }
];

const ROCKET_POOL = [
  { id: 52, name: 'Team Rocket Meowth', maxHp: 65, atk: 16, trainer: 'Team Rocket' },
  { id: 109, name: 'Team Rocket Koffing', maxHp: 70, atk: 18, trainer: 'Team Rocket' },
  { id: 23, name: 'Team Rocket Ekans', maxHp: 60, atk: 15, trainer: 'Team Rocket' }
];

const MARKET_PRICES = {
  wood: 40,
  bricks: 50,
  tiles: 60,
  cushions: 80
};

const HOUSE_STAGES = [
  {
    level: 0,
    badge: 'Stage 0: 📜 Blueprint Plot',
    nextTitle: 'Next: 🪵 Wooden Frame',
    recipeText: 'Needs: 2 Wood Planks',
    needs: { wood: 2, bricks: 0, tiles: 0, cushions: 0 },
    renderVisual: () => `
      <div class="stage-visual vis-blueprint">
        📜📐
        <span>Blueprint staked out on the hill!</span>
      </div>
    `
  },
  {
    level: 1,
    badge: 'Stage 1: 🪵 Wooden Framework',
    nextTitle: 'Next: 🧱 Cozy Walls & Door',
    recipeText: 'Needs: 2 Wood + 2 Stone Bricks',
    needs: { wood: 2, bricks: 2, tiles: 0, cushions: 0 },
    renderVisual: () => `
      <div class="stage-visual">
        <div class="vis-frame">🪵</div>
      </div>
    `
  },
  {
    level: 2,
    badge: 'Stage 2: 🧱 Cozy Walls & Door',
    nextTitle: 'Next: 🏠 Pikachu Red Roof',
    recipeText: 'Needs: 2 Stone Bricks + 2 Roof Tiles',
    needs: { wood: 0, bricks: 2, tiles: 2, cushions: 0 },
    renderVisual: () => `
      <div class="stage-visual">
        <div class="vis-walls">
          <div class="vis-window"></div>
          <div class="vis-door"></div>
          <div class="vis-window"></div>
        </div>
      </div>
    `
  },
  {
    level: 3,
    badge: 'Stage 3: 🏠 Pikachu Red Roof',
    nextTitle: 'Next: 🏰 Dream Pokémon Sanctuary',
    recipeText: 'Needs: 2 Cozy Cushions',
    needs: { wood: 0, bricks: 0, tiles: 0, cushions: 2 },
    renderVisual: () => `
      <div class="stage-visual vis-roof-container">
        <div class="vis-roof-top"></div>
        <div class="vis-walls">
          <div class="vis-window"></div>
          <div class="vis-door"></div>
          <div class="vis-window"></div>
        </div>
      </div>
    `
  },
  {
    level: 4,
    badge: 'Stage 4: 🏰 Master Pokémon Sanctuary!',
    nextTitle: 'Completed! 🎉',
    recipeText: 'Your house is 100% finished! ✨',
    needs: { wood: 0, bricks: 0, tiles: 0, cushions: 0 },
    renderVisual: () => `
      <div class="stage-visual vis-roof-container">
        <span class="vis-mansion-badge">✨🏰✨</span>
        <div class="vis-roof-top"></div>
        <div class="vis-walls">
          <div class="vis-window"></div>
          <div class="vis-door"></div>
          <div class="vis-window"></div>
        </div>
      </div>
    `
  }
];

// --- GAME STATE ---
const state = {
  currentTab: 'explore',
  partner: 'bulbasaur',
  partnerHp: parseInt(localStorage.getItem('pokemon_partner_hp') || '100', 10),
  partnerMaxHp: 100,
  coins: parseInt(localStorage.getItem('pokemon_coins') || '100', 10),
  potions: parseInt(localStorage.getItem('pokemon_potions') || '3', 10),
  rocketArrests: parseInt(localStorage.getItem('pokemon_arrests') || '0', 10),
  trainerExp: parseInt(localStorage.getItem('pokemon_exp') || '0', 10),
  caughtDex: JSON.parse(localStorage.getItem('pokemon_caught') || '{}'),
  
  // House Building Progression
  houseStage: parseInt(localStorage.getItem('pokemon_house_stage') || '0', 10),
  materials: JSON.parse(localStorage.getItem('pokemon_materials') || '{"wood":0,"bricks":0,"tiles":0,"cushions":0}'),

  // Battle State
  battle: {
    active: false,
    isRocket: false,
    opponent: null,
    opponentHp: 0,
    turn: 'player',
    opponentFainted: false,
    particles: []
  }
};

// --- DOM ELEMENTS ---
const banner = document.getElementById('game-banner');
const bannerText = document.getElementById('banner-text');
const trainerLevelText = document.getElementById('trainer-level-text');
const partnerHpBar = document.getElementById('partner-hp-bar');
const partnerHpText = document.getElementById('partner-hp-text');
const coinsCountEl = document.getElementById('coins-count');
const potionsCountEl = document.getElementById('potions-count');
const btnSound = document.getElementById('btn-sound');
const soundIcon = document.getElementById('sound-icon');

// Screens & Tabs
const navTabs = document.querySelectorAll('.nav-tab');
const screenViews = document.querySelectorAll('.screen-view');
const miniChips = document.querySelectorAll('.mini-chip');

// Explore Screen
const grassField = document.getElementById('grass-field');
const btnRustleAll = document.getElementById('btn-rustle-all');

// Battle Screen
const battleCanvas = document.getElementById('battle-canvas');
const bCtx = battleCanvas.getContext('2d');
const battleFxLayer = document.getElementById('battle-fx-layer');
const opponentName = document.getElementById('opponent-name');
const opponentHpFill = document.getElementById('opponent-hp-fill');
const opponentHpVal = document.getElementById('opponent-hp-val');
const battlePartnerName = document.getElementById('battle-partner-name');
const battlePartnerHpFill = document.getElementById('battle-partner-hp-fill');
const battlePartnerHpVal = document.getElementById('battle-partner-hp-val');
const battleDialogue = document.getElementById('battle-dialogue');
const btnAttack = document.getElementById('btn-attack');
const btnMoveText = document.getElementById('btn-move-text');
const btnPotion = document.getElementById('btn-potion');
const btnPotionQty = document.getElementById('btn-potion-qty');
const btnCatch = document.getElementById('btn-catch');
const btnRun = document.getElementById('btn-run');

// House Screen Elements
const houseStageBadge = document.getElementById('house-stage-badge');
const houseStructure = document.getElementById('house-structure');
const houseFriendsStage = document.getElementById('house-friends-stage');
const buildStepTitle = document.getElementById('build-step-title');
const buildRecipeText = document.getElementById('build-recipe-text');
const btnHammerBuild = document.getElementById('btn-hammer-build');
const matWood = document.getElementById('mat-wood');
const matBricks = document.getElementById('mat-bricks');
const matTiles = document.getElementById('mat-tiles');
const matCushions = document.getElementById('mat-cushions');
const marketCoinsVal = document.getElementById('market-coins-val');
const btnBuyMats = document.querySelectorAll('.btn-buy-mat');
const btnHouseRest = document.getElementById('btn-house-rest');
const btnBuyPotion = document.getElementById('btn-buy-potion');

// Jail Screen
const jailCaptureCount = document.getElementById('jail-capture-count');

// Pokédex Screen
const pokedexGrid = document.getElementById('pokedex-grid');
const dexTotalCaught = document.getElementById('dex-total-caught');

// --- SPRITE CACHE ---
const spriteCache = new Map();
function getSprite(id) {
  if (spriteCache.has(id)) return spriteCache.get(id);
  const img = new Image();
  img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  spriteCache.set(id, img);
  return img;
}

// Preload starters and Rocket monsters
Object.values(STARTERS).forEach(s => getSprite(s.id));
ROCKET_POOL.forEach(r => getSprite(r.id));

// --- UI UPDATE HELPERS ---
function saveState() {
  localStorage.setItem('pokemon_coins', state.coins);
  localStorage.setItem('pokemon_potions', state.potions);
  localStorage.setItem('pokemon_arrests', state.rocketArrests);
  localStorage.setItem('pokemon_exp', state.trainerExp);
  localStorage.setItem('pokemon_caught', JSON.stringify(state.caughtDex));
  localStorage.setItem('pokemon_partner_hp', state.partnerHp);
  localStorage.setItem('pokemon_house_stage', state.houseStage);
  localStorage.setItem('pokemon_materials', JSON.stringify(state.materials));
}

function updateHUD() {
  coinsCountEl.textContent = state.coins;
  potionsCountEl.textContent = state.potions;
  btnPotionQty.textContent = state.potions;
  marketCoinsVal.textContent = state.coins;
  jailCaptureCount.textContent = state.rocketArrests;

  // Materials
  matWood.textContent = state.materials.wood;
  matBricks.textContent = state.materials.bricks;
  matTiles.textContent = state.materials.tiles;
  matCushions.textContent = state.materials.cushions;

  const lvl = Math.floor(state.trainerExp / 100) + 1;
  trainerLevelText.textContent = `Trainer Lv. ${lvl}`;

  const hpPct = Math.max(0, Math.min(100, (state.partnerHp / state.partnerMaxHp) * 100));
  partnerHpBar.style.width = `${hpPct}%`;
  partnerHpBar.style.backgroundColor = hpPct > 50 ? '#10b981' : hpPct > 20 ? '#f59e0b' : '#ef4444';
  partnerHpText.textContent = `${state.partnerHp}/${state.partnerMaxHp}`;

  const starter = STARTERS[state.partner];
  battlePartnerName.textContent = starter.name;
  btnMoveText.textContent = starter.move;

  const totalCaught = Object.values(state.caughtDex).reduce((acc, v) => acc + v.count, 0);
  dexTotalCaught.textContent = totalCaught;

  saveState();
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
  battleFxLayer.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// --- SCREEN SWITCHER ---
function switchScreen(tabId) {
  state.currentTab = tabId;
  screenViews.forEach(v => v.classList.remove('active'));
  navTabs.forEach(t => t.classList.remove('active'));

  const activeScreen = document.getElementById(`screen-${tabId}`);
  if (activeScreen) activeScreen.classList.add('active');

  const activeTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  if (activeTab) activeTab.classList.add('active');

  if (tabId === 'house') renderHouse();
  if (tabId === 'pokedex') renderPokedex();
  if (tabId === 'battle') resizeBattleCanvas();
}

navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    sound.init();
    switchScreen(tab.dataset.tab);
  });
});

// Partner switch chips
miniChips.forEach(chip => {
  chip.addEventListener('click', () => {
    miniChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.partner = chip.dataset.pokemon;
    sound.playMoveSound(state.partner);
    updateHUD();
    showBanner(`Partner switched to ${STARTERS[state.partner].name}! ✨`);
  });
});

// Sound toggle
btnSound.addEventListener('click', () => {
  const on = sound.toggle();
  soundIcon.textContent = on ? '🔊' : '🔇';
});

// --- SCREEN 1: EXPLORE / TALL GRASS ---
function initGrassField() {
  grassField.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const patch = document.createElement('div');
    patch.className = 'grass-patch';
    patch.innerHTML = '🌾';
    patch.addEventListener('click', () => rustlePatch(patch));
    grassField.appendChild(patch);
  }
}

function rustlePatch(patch) {
  sound.playRustle();
  patch.classList.add('rustling');
  setTimeout(() => patch.classList.remove('rustling'), 400);

  const roll = Math.random();
  if (roll < 0.58) {
    const wild = WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)];
    startBattle(wild, false);
  } else if (roll < 0.73) {
    sound.playSiren();
    const rocketMon = ROCKET_POOL[Math.floor(Math.random() * ROCKET_POOL.length)];
    startBattle(rocketMon, true);
  } else if (roll < 0.88) {
    sound.playHeal();
    state.potions++;
    updateHUD();
    showBanner('🧪 You found a hidden Potion in the tall grass!');
  } else {
    sound.playCoin();
    const foundCoins = Math.floor(Math.random() * 25) + 20;
    state.coins += foundCoins;
    updateHUD();
    showBanner(`🪙 You found ${foundCoins} PokéCoins in the grass!`);
  }
}

btnRustleAll.addEventListener('click', () => {
  const patches = document.querySelectorAll('.grass-patch');
  const randomPatch = patches[Math.floor(Math.random() * patches.length)];
  rustlePatch(randomPatch);
});

// --- SCREEN 2: BATTLE ENGINE ---
function resizeBattleCanvas() {
  const rect = battleCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  battleCanvas.width = rect.width * dpr;
  battleCanvas.height = rect.height * dpr;
  bCtx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeBattleCanvas);

function startBattle(opponent, isRocket = false) {
  state.battle.active = true;
  state.battle.isRocket = isRocket;
  state.battle.opponent = opponent;
  state.battle.opponentHp = opponent.maxHp;
  state.battle.turn = 'player';
  state.battle.opponentFainted = false;
  state.battle.particles = [];

  switchScreen('battle');

  opponentName.textContent = opponent.name;
  opponentHpVal.textContent = `${opponent.maxHp}/${opponent.maxHp}`;
  opponentHpFill.style.width = '100%';
  opponentHpFill.style.backgroundColor = '#ef4444';

  btnCatch.classList.add('disabled');
  btnCatch.classList.remove('fainted-ready');
  btnCatch.innerHTML = '<span>🔴 Catch (Faint 1st)</span>';

  const introMsg = isRocket
    ? `🚨 TEAM ROCKET AMBUSH! "${opponent.name} attack!"`
    : `A wild ${opponent.name} jumped out of the grass!`;
  battleDialogue.textContent = introMsg;
  showBanner(introMsg);

  updateBattleHUD();
}

function updateBattleHUD() {
  const oppPct = Math.max(0, (state.battle.opponentHp / state.battle.opponent.maxHp) * 100);
  opponentHpFill.style.width = `${oppPct}%`;
  opponentHpVal.textContent = `${Math.max(0, state.battle.opponentHp)}/${state.battle.opponent.maxHp}`;

  const partPct = Math.max(0, (state.partnerHp / state.partnerMaxHp) * 100);
  battlePartnerHpFill.style.width = `${partPct}%`;
  battlePartnerHpVal.textContent = `${state.partnerHp}/${state.partnerMaxHp}`;

  if (partPct > 50) {
    battlePartnerHpFill.style.backgroundColor = '#10b981';
  } else if (partPct > 20) {
    battlePartnerHpFill.style.backgroundColor = '#f59e0b';
  } else {
    battlePartnerHpFill.style.backgroundColor = '#ef4444';
  }

  if (state.battle.opponentFainted && !state.battle.isRocket) {
    btnCatch.classList.remove('disabled');
    btnCatch.classList.add('fainted-ready');
    btnCatch.innerHTML = '<span>🔴 THROW BALL! (FAINTED!)</span>';
  } else {
    btnCatch.classList.add('disabled');
    btnCatch.classList.remove('fainted-ready');
    btnCatch.innerHTML = state.battle.isRocket ? '<span>🚫 Can\'t Catch Rocket</span>' : '<span>🔴 Catch (Faint 1st)</span>';
  }
}

// Player Attack
btnAttack.addEventListener('click', () => {
  if (state.battle.turn !== 'player' || !state.battle.active) return;
  const starter = STARTERS[state.partner];
  sound.playMoveSound(state.partner);

  const rect = battleCanvas.getBoundingClientRect();
  for (let i = 0; i < 20; i++) {
    state.battle.particles.push({
      x: rect.width * 0.7,
      y: rect.height * 0.3,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      radius: Math.random() * 6 + 3,
      color: starter.color,
      life: 1
    });
  }

  const dmg = starter.baseAtk + Math.floor(Math.random() * 8);
  state.battle.opponentHp -= dmg;
  showFloatingFx(`-${dmg}`, rect.width * 0.7, rect.height * 0.25, '#ef4444');
  battleDialogue.textContent = `${starter.name} used ${starter.move} for ${dmg} damage!`;

  if (state.battle.opponentHp <= 0) {
    state.battle.opponentHp = 0;
    state.battle.opponentFainted = true;
    updateBattleHUD();
    handleOpponentFaint();
  } else {
    updateBattleHUD();
    state.battle.turn = 'opponent';
    setTimeout(opponentTurn, 1000);
  }
});

// Player Potion
btnPotion.addEventListener('click', () => {
  if (state.battle.turn !== 'player' || !state.battle.active) return;
  if (state.potions <= 0) {
    showBanner('No Potions left! Buy some at the House!');
    return;
  }
  if (state.partnerHp >= state.partnerMaxHp) {
    showBanner('Partner is already at full HP!');
    return;
  }

  sound.playHeal();
  state.potions--;
  state.partnerHp = Math.min(state.partnerMaxHp, state.partnerHp + 40);
  updateHUD();
  updateBattleHUD();

  const rect = battleCanvas.getBoundingClientRect();
  showFloatingFx('+40 HP 🧪', rect.width * 0.25, rect.height * 0.65, '#10b981');
  battleDialogue.textContent = `Used a Potion! Healed ${STARTERS[state.partner].name} +40 HP!`;

  state.battle.turn = 'opponent';
  setTimeout(opponentTurn, 1000);
});

// Throw Pokéball (Enabled only when fainted!)
btnCatch.addEventListener('click', () => {
  if (!state.battle.opponentFainted || state.battle.isRocket || !state.battle.active) {
    if (!state.battle.opponentFainted) {
      showBanner('Wait! You must faint the Pokémon in battle first before catching!');
    }
    return;
  }

  state.battle.turn = 'ended';
  sound.playThrow();
  battleDialogue.textContent = `Throwing Pokéball at ${state.battle.opponent.name}...`;

  setTimeout(() => sound.playWobble(1), 800);
  setTimeout(() => sound.playWobble(2), 1600);
  setTimeout(() => sound.playWobble(3), 2400);

  setTimeout(() => {
    sound.playCatch();
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });

    const opp = state.battle.opponent;
    if (!state.caughtDex[opp.id]) {
      state.caughtDex[opp.id] = { name: opp.name, count: 0 };
    }
    state.caughtDex[opp.id].count++;
    state.trainerExp += 35;
    state.coins += 15;
    updateHUD();

    battleDialogue.textContent = `🎉 Gotcha! ${opp.name} was caught! Added to your House!`;
    showBanner(`🎉 Gotcha! ${opp.name} was caught!`, 3500);

    setTimeout(() => {
      state.battle.active = false;
      switchScreen('house');
    }, 2800);
  }, 3200);
});

// Run Away
btnRun.addEventListener('click', () => {
  sound.playRustle();
  state.battle.active = false;
  showBanner('Got away safely back to the grass! 🏃');
  switchScreen('explore');
});

// Opponent Turn
function opponentTurn() {
  if (!state.battle.active || state.battle.opponentFainted) return;

  const opp = state.battle.opponent;
  sound.playDamage();

  const dmg = opp.atk + Math.floor(Math.random() * 5);
  state.partnerHp = Math.max(0, state.partnerHp - dmg);
  updateHUD();
  updateBattleHUD();

  const rect = battleCanvas.getBoundingClientRect();
  showFloatingFx(`-${dmg}`, rect.width * 0.25, rect.height * 0.65, '#ef4444');
  battleDialogue.textContent = `${opp.name} attacked back for ${dmg} damage!`;

  if (state.partnerHp <= 0) {
    handlePartnerFaint();
  } else {
    state.battle.turn = 'player';
  }
}

// When Opponent Faints
function handleOpponentFaint() {
  if (state.battle.isRocket) {
    sound.playCatch();
    confetti({ particleCount: 120, spread: 90 });
    state.rocketArrests++;
    state.coins += 200; // Big cash reward for house building!
    updateHUD();

    battleDialogue.textContent = '🚔 Team Rocket was defeated and sent to JAIL! You earned 200 Coins! 💰';
    showBanner('🚔 Team Rocket locked in JAIL! +200 Coins for your house! 💰', 4000);

    setTimeout(() => {
      state.battle.active = false;
      switchScreen('jail');
    }, 3000);
  } else {
    sound.playHit();
    battleDialogue.textContent = `${state.battle.opponent.name} fainted! Tap THROW BALL to catch them! ⭐`;
    showBanner('The wild Pokémon fainted! Throw the Pokéball! 🔴', 3000);
  }
}

// When Player Partner Faints
function handlePartnerFaint() {
  sound.playLoss();

  if (state.battle.isRocket) {
    const caughtKeys = Object.keys(state.caughtDex);
    if (caughtKeys.length > 0) {
      const stolenKey = caughtKeys[Math.floor(Math.random() * caughtKeys.length)];
      const stolenName = state.caughtDex[stolenKey].name;
      delete state.caughtDex[stolenKey];
      updateHUD();
      battleDialogue.textContent = `😭 Team Rocket won and STOLE your ${stolenName}! Defeat them in Jail to stop them!`;
      showBanner(`🚨 Team Rocket stole your ${stolenName}!`, 4000);
    } else {
      battleDialogue.textContent = '😭 Team Rocket defeated you, but you had no Pokémon for them to steal!';
      showBanner('Team Rocket defeated you!', 3000);
    }
  } else {
    battleDialogue.textContent = `😭 Your partner fainted! Safely resting at the Pokémon House...`;
    showBanner('Your partner fainted! Returned to the House to rest.', 3500);
  }

  state.partnerHp = 20;
  updateHUD();

  setTimeout(() => {
    state.battle.active = false;
    switchScreen('house');
  }, 3200);
}

// Battle Rendering Loop
function renderBattle() {
  if (state.currentTab === 'battle' && state.battle.active) {
    const rect = battleCanvas.getBoundingClientRect();
    bCtx.clearRect(0, 0, rect.width, rect.height);
    const time = performance.now() / 1000;

    const oppX = rect.width * 0.72;
    const oppY = rect.height * 0.35;
    bCtx.fillStyle = 'rgba(0,0,0,0.18)';
    bCtx.beginPath();
    bCtx.ellipse(oppX, oppY + 50, 42, 12, 0, 0, Math.PI * 2);
    bCtx.fill();

    const oppImg = getSprite(state.battle.opponent.id);
    if (oppImg && oppImg.complete) {
      const bob = state.battle.opponentFainted ? 20 : Math.sin(time * 3) * 5;
      const size = 110;
      bCtx.save();
      if (state.battle.opponentFainted) {
        bCtx.globalAlpha = 0.6;
        bCtx.translate(oppX, oppY + bob);
        bCtx.rotate(0.3);
        bCtx.drawImage(oppImg, -size / 2, -size / 2, size, size);
      } else {
        bCtx.drawImage(oppImg, oppX - size / 2, oppY - size / 2 + bob, size, size);
      }
      bCtx.restore();
    }

    const pX = rect.width * 0.28;
    const pY = rect.height * 0.68;
    bCtx.fillStyle = 'rgba(0,0,0,0.18)';
    bCtx.beginPath();
    bCtx.ellipse(pX, pY + 45, 45, 14, 0, 0, Math.PI * 2);
    bCtx.fill();

    const starter = STARTERS[state.partner];
    const partnerImg = getSprite(starter.id);
    if (partnerImg && partnerImg.complete) {
      const pBob = Math.sin(time * 3.5 + 1) * 4;
      const pSize = 110;
      bCtx.drawImage(partnerImg, pX - pSize / 2, pY - pSize / 2 + pBob, pSize, pSize);
    }

    for (let i = state.battle.particles.length - 1; i >= 0; i--) {
      const p = state.battle.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) {
        state.battle.particles.splice(i, 1);
        continue;
      }
      bCtx.save();
      bCtx.globalAlpha = p.life;
      bCtx.fillStyle = p.color;
      bCtx.beginPath();
      bCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.restore();
    }
  }

  requestAnimationFrame(renderBattle);
}
requestAnimationFrame(renderBattle);

// --- SCREEN 3: HOUSE & BUILDER SYSTEM ---
function renderHouse() {
  const stage = HOUSE_STAGES[state.houseStage] || HOUSE_STAGES[0];
  houseStageBadge.textContent = stage.badge;
  houseStructure.innerHTML = stage.renderVisual();

  buildStepTitle.textContent = stage.nextTitle;
  buildRecipeText.textContent = stage.recipeText;

  // Check if player has required materials
  const hasMats = (
    state.houseStage < 4 &&
    state.materials.wood >= stage.needs.wood &&
    state.materials.bricks >= stage.needs.bricks &&
    state.materials.tiles >= stage.needs.tiles &&
    state.materials.cushions >= stage.needs.cushions
  );

  if (state.houseStage >= 4) {
    btnHammerBuild.classList.add('disabled');
    btnHammerBuild.classList.remove('ready');
    btnHammerBuild.innerHTML = '<span>🏆 House Complete!</span>';
  } else if (hasMats) {
    btnHammerBuild.classList.remove('disabled');
    btnHammerBuild.classList.add('ready');
    btnHammerBuild.innerHTML = '<span>🔨 HAMMER & BUILD!</span>';
  } else {
    btnHammerBuild.classList.add('disabled');
    btnHammerBuild.classList.remove('ready');
    btnHammerBuild.innerHTML = '<span>🔨 Need Materials</span>';
  }

  // Render Caught Pokémon wandering
  houseFriendsStage.innerHTML = '';
  const entries = Object.entries(state.caughtDex);

  const starter = STARTERS[state.partner];
  const starterToken = document.createElement('div');
  starterToken.className = 'friend-token';
  starterToken.innerHTML = `
    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${starter.id}.png" alt="${starter.name}" />
    <span>⭐ ${starter.name}</span>
  `;
  houseFriendsStage.appendChild(starterToken);

  if (entries.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.style.cssText = 'color: #92400e; font-size: 11px; font-weight: 700; text-align: center; width: 100%;';
    emptyMsg.innerHTML = 'Explore the tall grass to catch more friends to live in your house! 🏡';
    houseFriendsStage.appendChild(emptyMsg);
  } else {
    entries.forEach(([id, item]) => {
      const token = document.createElement('div');
      token.className = 'friend-token';
      token.innerHTML = `
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt="${item.name}" />
        <span>${item.name} (${item.count})</span>
      `;
      houseFriendsStage.appendChild(token);
    });
  }
}

// Hammer & Build Button
btnHammerBuild.addEventListener('click', () => {
  if (state.houseStage >= 4) return;
  const stage = HOUSE_STAGES[state.houseStage];
  
  const hasMats = (
    state.materials.wood >= stage.needs.wood &&
    state.materials.bricks >= stage.needs.bricks &&
    state.materials.tiles >= stage.needs.tiles &&
    state.materials.cushions >= stage.needs.cushions
  );

  if (!hasMats) {
    showBanner('You need more materials! Buy them in the Builder Market below! 🏪');
    return;
  }

  // Deduct materials
  state.materials.wood -= stage.needs.wood;
  state.materials.bricks -= stage.needs.bricks;
  state.materials.tiles -= stage.needs.tiles;
  state.materials.cushions -= stage.needs.cushions;

  // Clang Clang Clang!
  sound.playHammer();
  confetti({ particleCount: 90, spread: 75 });

  state.houseStage++;
  updateHUD();
  renderHouse();

  const newStage = HOUSE_STAGES[state.houseStage];
  showBanner(`🔨 Clang Clang! You built ${newStage.badge}! 🎉`, 3500);
});

// Buying Materials from Builder Market
btnBuyMats.forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.dataset.item;
    const price = MARKET_PRICES[item];

    if (state.coins < price) {
      showBanner(`Not enough coins! Defeat Team Rocket to get 200 coins! 💰`);
      return;
    }

    sound.playCoin();
    state.coins -= price;
    state.materials[item]++;
    updateHUD();
    renderHouse();
    showBanner(`Purchased 1 ${item}! Added to your backpack! 🎒`);
  });
});

btnHouseRest.addEventListener('click', () => {
  sound.playHeal();
  state.partnerHp = state.partnerMaxHp;
  updateHUD();
  showBanner('🛌 Your Pokémon rested happily! All HP fully restored! ✨');
});

btnBuyPotion.addEventListener('click', () => {
  if (state.coins < 30) {
    showBanner('Not enough coins! Defeat Team Rocket to get 200 coins! 💰');
    return;
  }
  sound.playCoin();
  state.coins -= 30;
  state.potions++;
  updateHUD();
  showBanner('🧪 Purchased 1 Potion for 30 Coins!');
});

// --- SCREEN 5: POKEDEX ---
function renderPokedex() {
  pokedexGrid.innerHTML = '';
  const entries = Object.entries(state.caughtDex);

  if (entries.length === 0) {
    pokedexGrid.innerHTML = `
      <div style="grid-column: span 3; text-align: center; color: #64748b; padding: 30px; font-weight: 700;">
        No Pokémon caught yet!<br>Search the tall grass to find and catch some! 🌿
      </div>
    `;
    return;
  }

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

// --- INIT APP ---
initGrassField();
updateHUD();
switchScreen('explore');
