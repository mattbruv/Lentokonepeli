import { ROTATION_DIRECTIONS } from "../constants";

export function directionToRadians(direction: number): number {
  return (Math.PI * 2 * direction) / ROTATION_DIRECTIONS;
}

// https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function magnitude(x: number, y: number): number {
  return Math.pow(Math.pow(x, 2) + Math.pow(y, 2), 0.5);
}

export function getAngle(x: number, y: number): number { //input vector, get vector angle
  const w0 = ROTATION_DIRECTIONS / 2;
  return mod(Math.round((w0 * Math.atan2(y, x)) / Math.PI), 2 * w0);
}

export function getInclination(w: number): number { //input angle (0,255), get incline (-64,64)
  const w0 = ROTATION_DIRECTIONS / 2;
  return Math.abs(mod(w - w0 / 2, 2 * w0) - w0) - w0 / 2;
}
