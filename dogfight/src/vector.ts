import { ROTATION_DIRECTIONS } from "./constants";

/**
 * An (x, y) position in the game world.
 */
export interface Vec2d {
  x: number;
  y: number;
}

/**
 * Moves a starting point by a specified direction
 * @param origin The starting point
 * @param translation The direction in which to move the starting point
 */
export function translatePoint(origin: Vec2d, translation: Vec2d): Vec2d {
  return {
    x: origin.x + translation.x,
    y: origin.y + translation.y
  };
}

/**
 * Rotate a point by the given angle around the origin (0, 0)
 * @param point The point to rotate
 * @param radians The angle at which to rotate the point
 */
export function rotatePoint(point: Vec2d, radians: number): Vec2d {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  };
}

/**
 * Turns our custom defined direction/angle into radians
 * @param direction The angle, between 0 and the maximum rotation directions
 */
export function directionToRadians(direction: number): number {
  return (Math.PI * 2 * direction) / ROTATION_DIRECTIONS;
}
