export const TAU = Math.PI * 2;

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(x, min, max) { return Math.max(min, Math.min(max, x)); }
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function latLonToVector3(latDeg, lonDeg, radius) {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const x = radius * Math.cos(lat) * Math.cos(lon);
  const z = radius * Math.cos(lat) * Math.sin(lon);
  const y = radius * Math.sin(lat);
  return { x, y, z };
}

export function animateTo(startValue, endValue, durationMs, onUpdate, onComplete, easing = easeInOutCubic) {
  const start = performance.now();
  function step(now) {
    const t = clamp((now - start) / durationMs, 0, 1);
    const k = easing(t);
    onUpdate(lerp(startValue, endValue, k));
    if (t < 1) requestAnimationFrame(step); else if (onComplete) onComplete();
  }
  requestAnimationFrame(step);
}

export function animateVector3(start, end, durationMs, onUpdate, onComplete, easing = easeInOutCubic) {
  const startTime = performance.now();
  function step(now) {
    const t = clamp((now - startTime) / durationMs, 0, 1);
    const k = easing(t);
    onUpdate({
      x: lerp(start.x, end.x, k),
      y: lerp(start.y, end.y, k),
      z: lerp(start.z, end.z, k)
    });
    if (t < 1) requestAnimationFrame(step); else if (onComplete) onComplete();
  }
  requestAnimationFrame(step);
}