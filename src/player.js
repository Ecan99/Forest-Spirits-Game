/** Player physics, coyote/buffer, double-jump, animations. */

import { TILE, isSolidTile } from "./levels.js";
import { axisX, jumpPressed, jumpHeld } from "./input.js";
import { sfxJump, sfxDoubleJump, sfxLand } from "./audio.js";

const RUN_ACCEL = 0.32;
const RUN_MAX = 1.05;
const FRICTION = 0.72;
const AIR_FRICTION = 0.9;
const GRAVITY = 0.15;
const MAX_FALL = 3.2;
const JUMP_VEL = -3.35;
const DBL_JUMP_VEL = -2.9;
const COYOTE_MAX = 12;
const BUFFER_MAX = 12;
const W = 10;
const H = 14;

export function createPlayer(x, y) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    w: W,
    h: H,
    facing: 1,
    onGround: false,
    coyote: 0,
    jumpBuf: 0,
    jumpsLeft: 2,
    /** Only cut jump height if the jump key was held when the jump started. */
    jumpCutArmed: false,
    anim: "idle",
    frame: 0,
    animTimer: 0,
    squash: 1,
    dead: false,
  };
}

export function resetPlayer(p, x, y) {
  p.x = x;
  p.y = y;
  p.vx = 0;
  p.vy = 0;
  p.onGround = false;
  p.coyote = 0;
  p.jumpBuf = 0;
  p.jumpsLeft = 2;
  p.jumpCutArmed = false;
  p.anim = "idle";
  p.frame = 0;
  p.animTimer = 0;
  p.squash = 1;
  p.dead = false;
}

/** OOB: solid on sides/ceiling, open below so pit falls can kill. */
function tileAt(level, px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (ty >= level.h) return 0;
  if (ty < 0 || tx < 0 || tx >= level.w) return 1;
  return level.tiles[ty][tx];
}

function collideAxis(p, level, axis) {
  const left = p.x;
  const right = p.x + p.w;
  const top = p.y;
  const bottom = p.y + p.h;

  const x0 = Math.floor(left / TILE);
  const x1 = Math.floor((right - 0.01) / TILE);
  const y0 = Math.floor(top / TILE);
  const y1 = Math.floor((bottom - 0.01) / TILE);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const id = tileAt(level, tx * TILE + 1, ty * TILE + 1);
      if (!isSolidTile(id)) continue;
      const tileL = tx * TILE;
      const tileR = tileL + TILE;
      const tileT = ty * TILE;
      const tileB = tileT + TILE;

      if (axis === "x") {
        if (p.vx > 0) p.x = tileL - p.w;
        else if (p.vx < 0) p.x = tileR;
        p.vx = 0;
      } else {
        if (p.vy > 0) {
          p.y = tileT - p.h;
          p.vy = 0;
          p.onGround = true;
        } else if (p.vy < 0) {
          p.y = tileB;
          p.vy = 0;
        }
      }
    }
  }
}

/** Gravity + Y collision while dead: fall into pits, stay on floors. */
function updateDeadPlayer(p, level) {
  p.vy += GRAVITY;
  if (p.vy > MAX_FALL) p.vy = MAX_FALL;
  p.onGround = false;
  p.y += p.vy;
  collideAxis(p, level, "y");
}

export function updatePlayer(p, level) {
  if (p.dead) {
    updateDeadPlayer(p, level);
    return;
  }

  if (p.squash < 1) p.squash = Math.min(1, p.squash + 0.08);

  const ax = axisX();
  if (ax !== 0) {
    p.vx += ax * RUN_ACCEL;
    p.facing = ax;
  }

  const max = RUN_MAX;
  if (p.vx > max) p.vx = max;
  if (p.vx < -max) p.vx = -max;
  p.vx *= p.onGround ? (ax === 0 ? FRICTION : 0.95) : AIR_FRICTION;
  if (Math.abs(p.vx) < 0.05 && ax === 0) p.vx = 0;

  if (jumpPressed()) p.jumpBuf = BUFFER_MAX;
  else if (p.jumpBuf > 0) p.jumpBuf--;

  const wasGround = p.onGround;
  p.onGround = false;

  p.vy += GRAVITY;
  if (p.vy > MAX_FALL) p.vy = MAX_FALL;

  p.x += p.vx;
  collideAxis(p, level, "x");
  p.y += p.vy;
  collideAxis(p, level, "y");

  if (p.x < 0) {
    p.x = 0;
    p.vx = 0;
  }
  if (p.x + p.w > level.pixelW) {
    p.x = level.pixelW - p.w;
    p.vx = 0;
  }

  if (p.onGround) {
    p.coyote = COYOTE_MAX;
    p.jumpsLeft = 2;
    p.jumpCutArmed = false;
    if (!wasGround) {
      p.squash = 0.7;
      sfxLand();
    }
  } else if (p.coyote > 0) {
    p.coyote--;
  } else if (p.jumpsLeft === 2) {
    p.jumpsLeft = 1;
  }

  if (p.jumpBuf > 0) {
    if (p.coyote > 0) {
      p.vy = JUMP_VEL;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      p.jumpsLeft = 1;
      // Arm cut only if jump is still held (buffered taps keep full height)
      p.jumpCutArmed = jumpHeld();
      p.squash = 1.15;
      sfxJump();
    } else if (!p.onGround && p.jumpsLeft > 0) {
      p.vy = DBL_JUMP_VEL;
      p.jumpBuf = 0;
      p.jumpsLeft = 0;
      p.jumpCutArmed = jumpHeld();
      p.squash = 1.1;
      sfxDoubleJump();
    }
  }

  // Variable jump height — only for jumps that started while held
  if (p.jumpCutArmed && !jumpHeld() && p.vy < -0.9) {
    p.vy *= 0.72;
  }

  updateAnim(p);
}

function updateAnim(p) {
  let next = "idle";
  if (!p.onGround) next = p.vy < 0 ? "jump" : "fall";
  else if (Math.abs(p.vx) > 0.2) next = "run";

  if (next !== p.anim) {
    p.anim = next;
    p.frame = 0;
    p.animTimer = 0;
  }
  p.animTimer++;
  const speed = p.anim === "run" ? 5 : 10;
  if (p.animTimer >= speed) {
    p.animTimer = 0;
    p.frame = (p.frame + 1) % 4;
  }
}

export function playerCenter(p) {
  return { x: p.x + p.w / 2, y: p.y + p.h / 2 };
}

/** One-hit lethal contact; returns true if death should start. */
export function playerHurt(p) {
  if (p.dead) return false;
  return true;
}

export function drawPlayer(ctx, p, camX, camY) {
  const px = Math.round(p.x - camX);
  const py = Math.round(p.y - camY);
  const cx = px + p.w / 2;
  const cy = py + p.h / 2;
  const sy = p.squash;
  const sx = 2 - sy;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(p.facing * sx, sy);
  ctx.translate(-p.w / 2, -p.h / 2);

  if (p.dead) ctx.globalAlpha = 0.55;

  // Cloak / body
  ctx.fillStyle = "#2d5a3a";
  ctx.fillRect(1, 4, 8, 9);
  // Head
  ctx.fillStyle = "#e8d5a8";
  ctx.fillRect(2, 1, 6, 5);
  // Hood
  ctx.fillStyle = "#3a6b48";
  ctx.fillRect(1, 0, 8, 3);
  ctx.fillRect(0, 2, 2, 3);
  ctx.fillRect(8, 2, 2, 3);
  // Eyes
  ctx.fillStyle = "#1a2a1e";
  ctx.fillRect(3, 3, 1, 1);
  ctx.fillRect(6, 3, 1, 1);
  // Gold spirit mark
  ctx.fillStyle = "#e0b84a";
  ctx.fillRect(4, 7, 2, 2);

  ctx.fillStyle = "#243828";
  if (p.anim === "run") {
    const leg = p.frame % 2 === 0;
    ctx.fillRect(leg ? 2 : 3, 12, 2, 3);
    ctx.fillRect(leg ? 6 : 5, 12, 2, 2);
  } else if (p.anim === "jump") {
    ctx.fillRect(2, 11, 2, 2);
    ctx.fillRect(6, 11, 2, 2);
  } else if (p.anim === "fall") {
    ctx.fillRect(2, 12, 2, 2);
    ctx.fillRect(6, 12, 2, 2);
  } else {
    const bob = p.frame < 2 ? 0 : 1;
    ctx.fillRect(2, 12 + bob, 2, 2);
    ctx.fillRect(6, 12 + bob, 2, 2);
  }

  ctx.fillStyle = "#e8d5a8";
  if (p.anim === "jump" || p.anim === "fall") {
    ctx.fillRect(9, 5, 2, 3);
  } else {
    ctx.fillRect(8, 6, 2, 3);
  }

  ctx.restore();
}
