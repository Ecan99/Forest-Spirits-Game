/** Keyboard input: arrows/WASD, Space, R, Enter, M. */

const KEY_MAP = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  KeyA: "left",
  KeyD: "right",
  KeyW: "up",
  KeyS: "down",
  Space: "jump",
  KeyR: "restart",
  Enter: "confirm",
  KeyM: "mute",
};

const held = Object.create(null);
const pressed = Object.create(null);
const released = Object.create(null);

function clearAllInput() {
  for (const k of Object.keys(held)) held[k] = false;
  for (const k of Object.keys(pressed)) pressed[k] = false;
  for (const k of Object.keys(released)) released[k] = false;
}

function onKeyDown(e) {
  const action = KEY_MAP[e.code];
  if (!action) return;
  e.preventDefault();
  if (!held[action]) pressed[action] = true;
  held[action] = true;
}

function onKeyUp(e) {
  const action = KEY_MAP[e.code];
  if (!action) return;
  e.preventDefault();
  held[action] = false;
  released[action] = true;
}

export function initInput() {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearAllInput);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearAllInput();
  });
}

export function updateInput() {
  for (const k of Object.keys(pressed)) pressed[k] = false;
  for (const k of Object.keys(released)) released[k] = false;
}

export function isDown(action) {
  return !!held[action];
}

export function justPressed(action) {
  return !!pressed[action];
}

export function justReleased(action) {
  return !!released[action];
}

/** Horizontal axis: -1 left, 1 right, 0 none. */
export function axisX() {
  let x = 0;
  if (held.left) x -= 1;
  if (held.right) x += 1;
  return x;
}

/** Jump from Space, W, or Up. */
export function jumpHeld() {
  return !!(held.jump || held.up);
}

export function jumpPressed() {
  return !!(pressed.jump || pressed.up);
}
