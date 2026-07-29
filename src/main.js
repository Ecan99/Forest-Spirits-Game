/**
 * Forest Spirits — boot, game loop, screen states.
 */

import { VIEW_W, VIEW_H, STAGES, MAX_LIVES } from "./levels.js";
import {
  initInput,
  updateInput,
  justPressed,
  jumpPressed,
} from "./input.js";
import { createCamera, cameraLookAt, cameraSnap } from "./camera.js";
import {
  updatePlayer,
  drawPlayer,
  playerCenter,
  playerHurt,
} from "./player.js";
import {
  updateOrbs,
  updateMites,
  updateGoal,
  drawOrbs,
  drawMites,
  drawGoal,
} from "./entities.js";
import {
  createGameState,
  loadStage,
  restartStage,
  beginFade,
  updateFade,
  checkPitDeath,
  isFallingIntoPit,
  drawTiles,
} from "./world.js";
import {
  createFireflies,
  updateFireflies,
  drawBackground,
  drawFireflies,
  drawVignette,
  drawHud,
  drawTitle,
  drawWin,
  drawFade,
  fitCanvas,
} from "./render.js";
import { toggleMute, sfxHurt, sfxWin, sfxUi } from "./audio.js";

const STATES = {
  TITLE: "title",
  PLAY: "play",
  WIN: "win",
};

/** Fixed simulation rate so high-Hz displays don't speed up gameplay. */
const TICK_MS = 1000 / 60;
const MAX_STEPS = 5;

let screen = STATES.TITLE;
let canvas;
let ctx;
let state;
let camera;
let fireflies;
let time = 0;
let lastTs = 0;
let accum = 0;

function boot() {
  canvas = document.getElementById("game");
  if (!canvas) {
    console.error("Forest Spirits: #game canvas not found");
    return;
  }
  ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Forest Spirits: 2D context unavailable");
    return;
  }
  ctx.imageSmoothingEnabled = false;

  initInput();
  camera = createCamera(VIEW_W, VIEW_H);
  state = createGameState();
  fireflies = createFireflies(18);

  fitCanvas(canvas);
  window.addEventListener("resize", () => fitCanvas(canvas));

  lastTs = performance.now();
  requestAnimationFrame(loop);
}

function startGame() {
  state.lives = MAX_LIVES;
  state.orbs = 0;
  state.orbsAtStageStart = 0;
  state.fade = 1;
  state.fadeDir = -1;
  loadStage(state, 0, camera);
  screen = STATES.PLAY;
  sfxUi();
}

function goTitle() {
  screen = STATES.TITLE;
  if (state.fade >= 1) state.fadeDir = -1;
  else {
    state.fade = 0;
    state.fadeDir = 0;
  }
  sfxUi();
}

function onDeath() {
  sfxHurt();
  state.lives -= 1;
  state.player.dead = true;
  state.player.vx = 0;
  state.deathTimer = 28;
}

function finishDeath() {
  if (state.lives <= 0) {
    beginFade(state, 1, "title");
  } else {
    beginFade(state, 1, "restart");
  }
}

function onGoalReached() {
  if (state.stageIndex + 1 < STAGES.length) {
    beginFade(state, 1, "next");
  } else {
    beginFade(state, 1, "win");
  }
}

function applyPending(action) {
  if (action === "restart") {
    restartStage(state);
  } else if (action === "next") {
    loadStage(state, state.stageIndex + 1, camera);
  } else if (action === "win") {
    screen = STATES.WIN;
    sfxWin();
  } else if (action === "title") {
    goTitle();
  } else if (action === "start") {
    startGame();
  }
}

function updatePlay() {
  if (justPressed("mute")) toggleMute();

  if (justPressed("restart") && state.fadeDir === 0) {
    beginFade(state, 1, "restart");
  }

  const fadeAction = updateFade(state);
  if (fadeAction) applyPending(fadeAction);

  // Freeze gameplay during fades (still tick fireflies for atmosphere)
  if (state.fadeDir !== 0) {
    updateFireflies(fireflies);
    return;
  }

  if (state.messageTimer > 0) state.messageTimer--;

  const p = state.player;
  const level = state.level;

  if (state.deathTimer > 0) {
    state.deathTimer--;
    updatePlayer(p, level);
    if (state.deathTimer === 0) finishDeath();
    updateFireflies(fireflies);
    return;
  }

  const ents = state.entities;

  updatePlayer(p, level);

  updateOrbs(ents.orbs, p, () => {
    state.orbs += 1;
  });

  updateMites(
    ents.enemies,
    p,
    () => {},
    () => {
      if (playerHurt(p)) onDeath();
    }
  );

  if (!p.dead) {
    updateGoal(ents.goal, p, onGoalReached);
  }

  if (checkPitDeath(p, level) && !p.dead) {
    onDeath();
  }

  if (!p.dead && !isFallingIntoPit(p, level)) {
    const c = playerCenter(p);
    cameraLookAt(camera, c.x, c.y, level.pixelW, level.pixelH);
  }
  updateFireflies(fireflies);
}

function drawPlay() {
  const snap = cameraSnap(camera);
  drawBackground(ctx, snap.x, time);
  drawTiles(ctx, state.level, snap.x, snap.y, VIEW_W, VIEW_H);
  drawGoal(ctx, state.entities.goal, snap.x, snap.y);
  drawOrbs(ctx, state.entities.orbs, snap.x, snap.y);
  drawMites(ctx, state.entities.enemies, snap.x, snap.y);
  drawPlayer(ctx, state.player, snap.x, snap.y);
  drawFireflies(ctx, fireflies);
  drawVignette(ctx);
  drawHud(ctx, state);
  drawFade(ctx, state.fade);
}

function updateTitle() {
  if (justPressed("mute")) toggleMute();
  updateFireflies(fireflies);
  if (state.fadeDir === 0 && (justPressed("confirm") || jumpPressed())) {
    beginFade(state, 1, "start");
  }
  const action = updateFade(state);
  if (action) applyPending(action);
}

function updateWin() {
  if (justPressed("mute")) toggleMute();
  updateFireflies(fireflies);
  updateFade(state);
  if (
    state.fadeDir === 0 &&
    (justPressed("restart") || justPressed("confirm") || jumpPressed())
  ) {
    goTitle();
  }
}

function tick() {
  time++;
  if (screen === STATES.TITLE) {
    updateTitle();
  } else if (screen === STATES.WIN) {
    updateWin();
  } else {
    updatePlay();
  }
  updateInput();
}

function draw() {
  if (screen === STATES.TITLE) {
    drawTitle(ctx, time, fireflies);
    drawFade(ctx, state.fade);
  } else if (screen === STATES.WIN) {
    drawWin(ctx, state, time, fireflies);
    drawFade(ctx, state.fade);
  } else {
    drawPlay();
  }
}

function loop(ts) {
  const frameMs = Math.min(100, ts - lastTs);
  lastTs = ts;
  accum += frameMs;

  let steps = 0;
  while (accum >= TICK_MS && steps < MAX_STEPS) {
    tick();
    accum -= TICK_MS;
    steps++;
  }

  draw();
  requestAnimationFrame(loop);
}

boot();
