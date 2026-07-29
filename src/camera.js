/** Smooth follow camera with pixel snap and level bounds. */

export function createCamera(viewW, viewH) {
  return {
    x: 0,
    y: 0,
    viewW,
    viewH,
    ease: 0.12,
  };
}

function clampDesired(cam, targetX, targetY, worldW, worldH) {
  const halfW = cam.viewW / 2;
  const halfH = cam.viewH / 2;
  let desiredX = targetX - halfW;
  let desiredY = targetY - halfH;

  const maxX = Math.max(0, worldW - cam.viewW);
  const maxY = Math.max(0, worldH - cam.viewH);
  desiredX = Math.max(0, Math.min(maxX, desiredX));
  desiredY = Math.max(0, Math.min(maxY, desiredY));
  return { desiredX, desiredY };
}

export function cameraLookAt(cam, targetX, targetY, worldW, worldH) {
  const { desiredX, desiredY } = clampDesired(cam, targetX, targetY, worldW, worldH);

  cam.x += (desiredX - cam.x) * cam.ease;
  cam.y += (desiredY - cam.y) * cam.ease;

  if (Math.abs(desiredX - cam.x) < 0.05) cam.x = desiredX;
  if (Math.abs(desiredY - cam.y) < 0.05) cam.y = desiredY;
}

export function cameraSnap(cam) {
  return {
    x: Math.round(cam.x),
    y: Math.round(cam.y),
  };
}

/** Instant snap to target (no ease) for stage load / restart. */
export function cameraReset(cam, x, y, worldW, worldH) {
  const { desiredX, desiredY } = clampDesired(cam, x, y, worldW, worldH);
  cam.x = Math.round(desiredX);
  cam.y = Math.round(desiredY);
}
