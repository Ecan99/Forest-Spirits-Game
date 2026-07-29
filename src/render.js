/** Parallax, fireflies, UI, title/win screens, vignette. */

import { VIEW_W, VIEW_H, MAX_LIVES } from "./levels.js";
import { isMuted } from "./audio.js";

const PAL = {
  skyTop: "#2a3a4a",
  skyBot: "#121c28",
  hillFar: "#1a2e32",
  hillNear: "#243c38",
  treeDark: "#142828",
  treeMid: "#1e3834",
  ui: "#e8dcc0",
  gold: "#e0b84a",
  orb: "#a86cf0",
  moss: "#6a9a4a",
};

export function createFireflies(count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      x: Math.random() * VIEW_W,
      y: Math.random() * VIEW_H,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
      drift: 0.2 + Math.random() * 0.4,
    });
  }
  return list;
}

export function updateFireflies(flies, dt = 1) {
  for (const f of flies) {
    f.phase += 0.04 * dt;
    f.x += Math.sin(f.phase * 0.7) * f.drift * dt;
    f.y += Math.cos(f.phase) * f.speed * 0.15 * dt;
    if (f.x < -4) f.x = VIEW_W + 4;
    if (f.x > VIEW_W + 4) f.x = -4;
    if (f.y < -4) f.y = VIEW_H + 4;
    if (f.y > VIEW_H + 4) f.y = -4;
  }
}

export function drawBackground(ctx, camX, time) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, PAL.skyTop);
  g.addColorStop(1, PAL.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Far hills
  const far = (camX * 0.15) % 80;
  ctx.fillStyle = PAL.hillFar;
  for (let i = -1; i < 6; i++) {
    const x = i * 80 - far;
    drawHill(ctx, x, 110, 90, 40);
  }

  // Mid trees silhouettes
  const mid = (camX * 0.35) % 48;
  ctx.fillStyle = PAL.treeDark;
  for (let i = -1; i < 9; i++) {
    const x = i * 48 - mid;
    drawTree(ctx, x + 10, 95, 0.7);
  }

  // Near canopy fringe
  const near = (camX * 0.55) % 64;
  ctx.fillStyle = PAL.hillNear;
  for (let i = -1; i < 7; i++) {
    const x = i * 64 - near;
    drawHill(ctx, x, 140, 70, 50);
  }

  // Soft light shafts
  ctx.fillStyle = `rgba(180, 200, 120, ${0.03 + Math.sin(time * 0.02) * 0.015})`;
  ctx.fillRect(40, 0, 30, VIEW_H);
  ctx.fillRect(200, 0, 20, VIEW_H);
}

function drawHill(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w / 2, y - h * 0.3, x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

function drawTree(ctx, x, y, s) {
  ctx.fillRect(x + 6 * s, y + 20 * s, 4 * s, 28 * s);
  ctx.beginPath();
  ctx.moveTo(x, y + 24 * s);
  ctx.lineTo(x + 8 * s, y);
  ctx.lineTo(x + 16 * s, y + 24 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 2 * s, y + 14 * s);
  ctx.lineTo(x + 8 * s, y - 6 * s);
  ctx.lineTo(x + 14 * s, y + 14 * s);
  ctx.closePath();
  ctx.fill();
}

export function drawFireflies(ctx, flies) {
  for (const f of flies) {
    const a = 0.35 + Math.sin(f.phase) * 0.35;
    ctx.fillStyle = `rgba(240, 216, 120, ${a})`;
    ctx.fillRect(Math.round(f.x), Math.round(f.y), 2, 2);
    ctx.fillStyle = `rgba(255, 246, 200, ${a * 0.5})`;
    ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 4, 4);
  }
}

export function drawVignette(ctx) {
  const g = ctx.createRadialGradient(
    VIEW_W / 2,
    VIEW_H / 2,
    60,
    VIEW_W / 2,
    VIEW_H / 2,
    160
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawHud(ctx, state) {
  ctx.fillStyle = "rgba(10, 18, 14, 0.45)";
  ctx.fillRect(4, 4, 110, 28);

  for (let i = 0; i < MAX_LIVES; i++) {
    ctx.fillStyle = i < state.lives ? PAL.moss : "#2a3830";
    drawLeaf(ctx, 10 + i * 12, 10);
  }

  ctx.fillStyle = PAL.orb;
  ctx.beginPath();
  ctx.arc(10, 24, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.ui;
  ctx.font = "8px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`x${state.orbs}`, 16, 27);

  if (state.stage) {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(232, 220, 192, 0.85)";
    ctx.fillText(`Stage ${state.stage.id}: ${state.stage.name}`, VIEW_W - 6, 14);
  }

  if (isMuted()) {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(232, 220, 192, 0.5)";
    ctx.fillText("MUTE", VIEW_W - 6, VIEW_H - 6);
  }

  if (state.messageTimer > 0) {
    const a = Math.min(1, state.messageTimer / 20);
    ctx.textAlign = "center";
    ctx.fillStyle = `rgba(232, 220, 192, ${a})`;
    ctx.font = "10px monospace";
    ctx.fillText(state.message, VIEW_W / 2, 48);
  }
}

function drawLeaf(ctx, x, y) {
  ctx.beginPath();
  ctx.ellipse(x, y, 4, 3, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTitle(ctx, time, fireflies) {
  drawBackground(ctx, time * 0.4, time);
  drawFireflies(ctx, fireflies);

  ctx.textAlign = "center";
  ctx.fillStyle = PAL.moss;
  ctx.font = "bold 22px monospace";
  ctx.fillText("FOREST", VIEW_W / 2, 62);
  ctx.fillStyle = PAL.gold;
  ctx.fillText("SPIRITS", VIEW_W / 2, 84);

  ctx.fillStyle = "rgba(232, 220, 192, 0.7)";
  ctx.font = "8px monospace";
  ctx.fillText("A tiny mossy platformer", VIEW_W / 2, 100);

  const pulse = 0.55 + Math.sin(time * 0.08) * 0.45;
  ctx.fillStyle = `rgba(224, 184, 74, ${pulse})`;
  ctx.font = "9px monospace";
  ctx.fillText("Press Enter or Space", VIEW_W / 2, 128);

  ctx.fillStyle = "rgba(232, 220, 192, 0.45)";
  ctx.font = "7px monospace";
  ctx.fillText("Arrows/WASD move · Space/W/Up jump · R restart · M mute", VIEW_W / 2, 150);

  drawVignette(ctx);
}

export function drawWin(ctx, state, time, fireflies) {
  drawBackground(ctx, 200 + time * 0.2, time);
  drawFireflies(ctx, fireflies);

  ctx.textAlign = "center";
  ctx.fillStyle = PAL.gold;
  ctx.font = "bold 18px monospace";
  ctx.fillText("Spirit Path Complete", VIEW_W / 2, 70);

  ctx.fillStyle = PAL.orb;
  ctx.font = "9px monospace";
  ctx.fillText(`Orbs gathered: ${state.orbs}`, VIEW_W / 2, 96);

  const pulse = 0.55 + Math.sin(time * 0.08) * 0.45;
  ctx.fillStyle = `rgba(160, 200, 120, ${pulse})`;
  ctx.fillText("Press R or Enter for title", VIEW_W / 2, 130);

  drawVignette(ctx);
}

export function drawFade(ctx, fade) {
  if (fade <= 0) return;
  ctx.fillStyle = `rgba(8, 14, 10, ${fade})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function fitCanvas(canvas) {
  const scaleX = window.innerWidth / VIEW_W;
  const scaleY = (window.innerHeight - 40) / VIEW_H;
  // Uniform scale; allow < 1 on small viewports to preserve aspect
  const scale = Math.max(0.5, Math.min(scaleX, scaleY));
  canvas.style.width = `${VIEW_W * scale}px`;
  canvas.style.height = `${VIEW_H * scale}px`;
  return scale;
}
