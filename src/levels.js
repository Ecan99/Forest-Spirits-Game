/**
 * Tile IDs: 0 air, 1 ground, 2 moss top, 3 bark platform.
 * Levels are row-major strings for readability.
 */

export const TILE = 16;
export const VIEW_W = 320;
export const VIEW_H = 180;
export const MAX_LIVES = 3;

// Stage 1: teach run → jump → double-jump over wider gaps
const STAGE1_ROWS = [
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "............................................",
  "......................###...................",
  "............###.................###.........",
  ".......##...................................",
  "............................................",
  "######..######...######..#####....##########",
  "######..######...######..#####....##########",
];

// Stage 2: taller steps, staggered jumps, longer path
const STAGE2_ROWS = [
  "................................................",
  "................................................",
  "......................###.......................",
  "................................................",
  "...............###.............###..............",
  "................................................",
  "......###.................###........###........",
  "................................................",
  "....###............####.................##......",
  "................................................",
  "#####..######..#######...######..#####...#######",
  "#####..######..#######...######..#####...#######",
];

function parseRows(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const tiles = new Array(h);
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    if (row.length !== w) {
      throw new Error(`Level row ${y} length ${row.length} != ${w}`);
    }
    tiles[y] = new Array(w);
    for (let x = 0; x < w; x++) {
      const c = row[x];
      if (c === "#") tiles[y][x] = 1;
      else if (c === "M") tiles[y][x] = 2;
      else if (c === "=") tiles[y][x] = 3;
      else tiles[y][x] = 0;
    }
  }
  return { tiles, w, h };
}

/** Auto-decorate ground tops as moss when air above. */
function decorateMoss(level) {
  for (let y = 0; y < level.h; y++) {
    for (let x = 0; x < level.w; x++) {
      if (level.tiles[y][x] === 1) {
        const above = y > 0 ? level.tiles[y - 1][x] : 0;
        if (above === 0) level.tiles[y][x] = 2;
      }
    }
  }
}

export function isSolidTile(id) {
  return id === 1 || id === 2 || id === 3;
}

export const STAGES = [
  {
    id: 1,
    name: "Moss Path",
    spawn: { x: 24, y: 120 },
    // Ground top y = 9*16 = 144; shrine h=24 → y=120
    goal: { x: 660, y: 120 },
    orbs: [
      { x: 72, y: 128 },
      { x: 120, y: 128 },
      { x: 168, y: 96 },
      { x: 230, y: 128 },
      { x: 300, y: 80 },
      { x: 370, y: 128 },
      { x: 450, y: 96 },
      { x: 530, y: 128 },
      { x: 600, y: 128 },
    ],
    // Mite h=10 → y = 144 - 10 = 134; patrols stay on solid ground segments
    enemies: [
      { x: 300, y: 134, minX: 272, maxX: 368 },
      { x: 620, y: 134, minX: 544, maxX: 704 },
    ],
    build() {
      const level = parseRows(STAGE1_ROWS);
      decorateMoss(level);
      level.pixelW = level.w * TILE;
      level.pixelH = level.h * TILE;
      return level;
    },
  },
  {
    id: 2,
    name: "Canopy Steps",
    spawn: { x: 24, y: 136 },
    goal: { x: 720, y: 136 },
    orbs: [
      { x: 80, y: 112 },
      { x: 140, y: 80 },
      { x: 200, y: 144 },
      { x: 280, y: 64 },
      { x: 360, y: 112 },
      { x: 440, y: 80 },
      { x: 520, y: 48 },
      { x: 580, y: 112 },
      { x: 640, y: 80 },
      { x: 690, y: 144 },
      { x: 730, y: 120 },
    ],
    // Ground top y = 10*16 = 160; mite y = 150; patrols on solid segments
    enemies: [
      { x: 150, y: 150, minX: 112, maxX: 208 },
      { x: 280, y: 150, minX: 240, maxX: 352 },
      { x: 560, y: 150, minX: 528, maxX: 608 },
    ],
    build() {
      const level = parseRows(STAGE2_ROWS);
      decorateMoss(level);
      level.pixelW = level.w * TILE;
      level.pixelH = level.h * TILE;
      return level;
    },
  },
];

export function getStage(index) {
  return STAGES[index] || null;
}
