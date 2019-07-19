import { ROTATION_DIRECTIONS } from "./constants";

/**
 * A position in the game world.
 */
export interface Vec2d {
  x: number;
  y: number;
}

/**
 * Turns our custom defined direction/angle into radians
 * @param direction The angle, between 0 and the maximum rotation directions
 */
export function directionToRadians(direction: number): number {
  return (Math.PI * 2 * direction) / ROTATION_DIRECTIONS;
}
