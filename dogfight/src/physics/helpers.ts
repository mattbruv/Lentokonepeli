import { ROTATION_DIRECTIONS } from "../constants";

export function directionToRadians(direction: number): number {
  return (Math.PI * 2 * direction) / ROTATION_DIRECTIONS;
}
