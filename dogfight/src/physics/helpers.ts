import { ROTATION_DIRECTIONS } from "../constants";

/**
 * Turns our custom defined direction/angle into radians
 * @param direction The angle, between 0 and the maximum rotation directions
 */
export function directionToRadians(direction: number): number {
  return (Math.PI * 2 * direction) / ROTATION_DIRECTIONS;
}

export function radiansToDirection(radians: number): number {
  return Math.round((radians * ROTATION_DIRECTIONS) / (Math.PI * 2));
}

// https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
