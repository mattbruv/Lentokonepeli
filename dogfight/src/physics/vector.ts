import { ROTATION_DIRECTIONS, FacingDirection } from "../constants";
import { mod } from "./helpers";

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

export function magnitude(v: Vec2d): number {
  return Math.pow(Math.pow(v.x, 2) + Math.pow(v.y, 2), 0.5);
}

export function distance(v: Vec2d, u: Vec2d): number {
  const x = Math.abs(v.x - u.x);
  const y = Math.abs(v.y - u.y);
  return magnitude({ x: x, y: y });
}

export function getAngle(v: Vec2d): number {
  //input vector, get vector angle
  const w0 = ROTATION_DIRECTIONS / 2;
  return mod(Math.round((w0 * Math.atan2(v.y, v.x)) / Math.PI), 2 * w0);
}

export function getInclination(w: number): number {
  //input angle (0,255), get incline (-64,64)
  const w0 = ROTATION_DIRECTIONS / 2;
  return Math.abs(mod(w - w0 / 2, 2 * w0) - w0) - w0 / 2;
}

export function getFacingDirection(w: number): FacingDirection {
  if (w < (3 * ROTATION_DIRECTIONS) / 4 && w > ROTATION_DIRECTIONS / 4) {
    return FacingDirection.Left;
  } else {
    return FacingDirection.Right;
  }
}

export function dot(a: Vec2d, b: Vec2d): number {
  return a.x * b.x + a.y * b.y;
}

export function setSize(v: Vec2d, s: number): Vec2d {
  const m = s / magnitude(v);
  return { x: v.x * m, y: v.y * m };
}

export function scale(v: Vec2d, s: number): Vec2d {
  return { x: v.x * s, y: v.y * s };
}
