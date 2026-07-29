/** Spirit orbs, moss-mites, goal shrine. */

import { sfxCollect, sfxStomp, sfxGoal } from "./audio.js";

export function createOrb(x, y) {
  return {
    x,
    y,
    r: 5,
    collected: false,
    pop: 0,
    phase: Math.random() * Math.PI * 2,
  };
}

export function createMite(x, y, minX, maxX) {
  return {
    x,
    y,
    w: 12,
    h: 10,
    vx: 0.28,
    minX,
    maxX,
    alive: true,
    squash: 1,
    phase: Math.random() * Math.PI * 2,
  };
}

export function createGoal(x, y) {
  return { x, y, w: 16, h: 24, reached: false, phase: 0 };
}

export function spawnEntities(stage) {
  return {
    orbs: stage.orbs.map((o) => createOrb(o.x, o.y)),
    enemies: stage.enemies.map((e) =>
      createMite(e.x, e.y, e.minX, e.maxX)
    ),
    goal: createGoal(stage.goal.x, stage.goal.y),
  };
}

export function updateOrbs(orbs, player, onCollect) {
  if (player.dead) return;
  for (const o of orbs) {
    o.phase += 0.08;
    if (o.collected) {
      if (o.pop > 0) o.pop--;
      continue;
    }
    const orbY = o.y + Math.sin(o.phase) * 2;
    // Closest point on player AABB to orb center
    const closestX = Math.max(player.x, Math.min(o.x, player.x + player.w));
    const closestY = Math.max(player.y, Math.min(orbY, player.y + player.h));
    const dx = o.x - closestX;
    const dy = orbY - closestY;
    if (dx * dx + dy * dy < o.r * o.r) {
      o.collected = true;
      o.pop = 10;
      sfxCollect();
      onCollect();
    }
  }
}

export function updateMites(enemies, player, onStomp, onHurt) {
  for (const m of enemies) {
    if (!m.alive) {
      if (m.squash > 0.2) m.squash *= 0.85;
      continue;
    }
    m.phase += 0.12;
    m.x += m.vx;
    if (m.x < m.minX) {
      m.x = m.minX;
      m.vx = Math.abs(m.vx);
    }
    if (m.x + m.w > m.maxX) {
      m.x = m.maxX - m.w;
      m.vx = -Math.abs(m.vx);
    }

    if (player.dead) continue;

    const overlap =
      player.x < m.x + m.w &&
      player.x + player.w > m.x &&
      player.y < m.y + m.h &&
      player.y + player.h > m.y;

    if (!overlap) continue;

    // Require crossing the mite top from above (prev bottom was above or at top)
    const prevBottom = player.y + player.h - player.vy;
    const stomp =
      player.vy > 0 &&
      prevBottom <= m.y + 2 &&
      player.y + player.h - m.y < 10;

    if (stomp) {
      m.alive = false;
      m.squash = 0.35;
      player.vy = -2.6;
      player.jumpCutArmed = false;
      sfxStomp();
      onStomp();
    } else {
      onHurt();
    }
  }
}

export function updateGoal(goal, player, onReach) {
  goal.phase += 0.06;
  if (goal.reached || player.dead) return;
  const overlap =
    player.x < goal.x + goal.w &&
    player.x + player.w > goal.x &&
    player.y < goal.y + goal.h &&
    player.y + player.h > goal.y;
  if (overlap) {
    goal.reached = true;
    sfxGoal();
    onReach();
  }
}

export function drawOrbs(ctx, orbs, camX, camY) {
  for (const o of orbs) {
    if (o.collected && o.pop <= 0) continue;
    const bob = Math.sin(o.phase) * 2;
    const x = Math.round(o.x - camX);
    const y = Math.round(o.y + bob - camY);
    const scale = o.collected ? 1 + (10 - o.pop) * 0.15 : 1;
    const r = o.r * scale;

    ctx.fillStyle = "rgba(160, 100, 220, 0.3)";
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#a86cf0";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e8d0ff";
    ctx.fillRect(x - 1, y - 2, 2, 2);
  }
}

export function drawMites(ctx, enemies, camX, camY) {
  for (const m of enemies) {
    if (!m.alive && m.squash < 0.25) continue;
    const x = Math.round(m.x - camX);
    const y = Math.round(m.y - camY);
    const bob = m.alive ? Math.sin(m.phase) * 1 : 0;
    const h = Math.max(2, m.h * m.squash);
    const w = m.w * (2 - m.squash);

    ctx.fillStyle = "#4a6b3a";
    ctx.fillRect(x + (m.w - w) / 2, y + m.h - h + bob, w, h);
    ctx.fillStyle = "#6a8a4a";
    ctx.fillRect(x + 2, y + 2 + bob, 3, 2);
    ctx.fillRect(x + 7, y + 2 + bob, 3, 2);
    if (m.alive) {
      ctx.fillStyle = "#1a2018";
      ctx.fillRect(x + 3, y + 4 + bob, 2, 2);
      ctx.fillRect(x + 7, y + 4 + bob, 2, 2);
      // Moss tufts
      ctx.fillStyle = "#7cb05a";
      ctx.fillRect(x + 1, y + bob, 2, 2);
      ctx.fillRect(x + 9, y + bob, 2, 2);
    }
  }
}

export function drawGoal(ctx, goal, camX, camY) {
  const x = Math.round(goal.x - camX);
  const y = Math.round(goal.y - camY);
  const shimmer = 0.5 + Math.sin(goal.phase) * 0.5;

  // Shrine base
  ctx.fillStyle = "#3a2a1c";
  ctx.fillRect(x + 2, y + 16, 12, 8);
  ctx.fillStyle = "#5a4030";
  ctx.fillRect(x + 4, y + 14, 8, 4);

  // Leaf portal
  ctx.fillStyle = `rgba(120, 200, 100, ${0.35 + shimmer * 0.35})`;
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 8, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(224, 184, 74, ${0.5 + shimmer * 0.5})`;
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 8, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e8f0c8";
  ctx.fillRect(x + 7, y + 5, 2, 4);
}
