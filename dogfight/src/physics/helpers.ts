import { ROTATION_DIRECTIONS } from "../constants";

export function directionToRadians(direction: number): number {
  return (Math.PI * 2 * direction) / ROTATION_DIRECTIONS;
}

// https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
