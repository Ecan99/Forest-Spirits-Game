/** Collision helpers, stage load / spawn / flow. */

import { getStage, TILE, MAX_LIVES } from "./levels.js";
import { createPlayer, resetPlayer } from "./player.js";
import { spawnEntities } from "./entities.js";
import { cameraReset } from "./camera.js";

export function createGameState() {
  return {
    stageIndex: 0,
    stage: null,
    level: null,
    player: null,
    entities: null,
    lives: MAX_LIVES,
    orbs: 0,
    /** Orb count at the start of the current stage (restored on death restart). */
    orbsAtStageStart: 0,
    camera: null,
    fade: 0,
    fadeDir: 0,
    pending: null,
    deathTimer: 0,
    message: "",
    messageTimer: 0,
  };
}

export function loadStage(state, index, camera) {
  const stage = getStage(index);
  if (!stage) return false;
  state.stageIndex = index;
  state.stage = stage;
  state.level = stage.build();
  state.entities = spawnEntities(stage);
  if (!state.player) {
    state.player = createPlayer(stage.spawn.x, stage.spawn.y);
  } else {
    resetPlayer(state.player, stage.spawn.x, stage.spawn.y);
  }
  state.camera = camera;
  cameraReset(
    camera,
    stage.spawn.x + 5,
    stage.spawn.y + 7,
    state.level.pixelW,
    state.level.pixelH
  );
  state.deathTimer = 0;
  state.message = stage.name;
  state.messageTimer = 90;
  state.orbsAtStageStart = state.orbs;
  return true;
}

export function restartStage(state) {
  state.orbs = state.orbsAtStageStart;
  loadStage(state, state.stageIndex, state.camera);
}

export function beginFade(state, dir, pending) {
  state.fadeDir = dir;
  state.pending = pending;
}

export function updateFade(state) {
  if (state.fadeDir === 0) return null;
  state.fade += state.fadeDir * 0.06;
  if (state.fadeDir > 0 && state.fade >= 1) {
    state.fade = 1;
    state.fadeDir = -1;
    const action = state.pending;
    state.pending = null;
    return action;
  }
  if (state.fadeDir < 0 && state.fade <= 0) {
    state.fade = 0;
    state.fadeDir = 0;
  }
  return null;
}

/** Kill once the player drops clearly below the stage (no long off-screen fall). */
export function checkPitDeath(player, level) {
  return player.y + player.h > level.pixelH + 8;
}

export function isFallingIntoPit(player, level) {
  return player.y + player.h > level.pixelH - 4;
}

export function drawTiles(ctx, level, camX, camY, viewW, viewH) {
  const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const y0 = Math.max(0, Math.floor(camY / TILE) - 1);
  const x1 = Math.min(level.w - 1, Math.floor((camX + viewW) / TILE) + 1);
  const y1 = Math.min(level.h - 1, Math.floor((camY + viewH) / TILE) + 1);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const id = level.tiles[ty][tx];
      if (!id) continue;
      const x = Math.round(tx * TILE - camX);
      const y = Math.round(ty * TILE - camY);
      drawTile(ctx, id, x, y);
    }
  }
}

function drawTile(ctx, id, x, y) {
  if (id === 1) {
    ctx.fillStyle = "#3a2a1c";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#2a1e14";
    ctx.fillRect(x, y + 10, TILE, 6);
    ctx.fillStyle = "#4a3828";
    ctx.fillRect(x + 2, y + 3, 3, 2);
    ctx.fillRect(x + 9, y + 6, 4, 2);
  } else if (id === 2) {
    ctx.fillStyle = "#3a2a1c";
    ctx.fillRect(x, y + 4, TILE, TILE - 4);
    ctx.fillStyle = "#2a1e14";
    ctx.fillRect(x, y + 12, TILE, 4);
    ctx.fillStyle = "#4a7a3a";
    ctx.fillRect(x, y, TILE, 5);
    ctx.fillStyle = "#6a9a4a";
    ctx.fillRect(x + 1, y, 3, 2);
    ctx.fillRect(x + 6, y + 1, 4, 2);
    ctx.fillRect(x + 12, y, 3, 2);
    ctx.fillStyle = "#8aba5a";
    ctx.fillRect(x + 3, y, 2, 1);
    ctx.fillRect(x + 10, y, 2, 1);
  } else if (id === 3) {
    ctx.fillStyle = "#4a3424";
    ctx.fillRect(x, y + 4, TILE, 8);
    ctx.fillStyle = "#5a7a40";
    ctx.fillRect(x, y + 2, TILE, 4);
  }
}
