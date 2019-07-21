import { Vec2d, directionToRadians } from "./vector";

// Collision detection for rotated rectangles
// relies on the Separating Axis Theorem described here:
// https://www.gamedev.net/articles/programming/general-and-gameplay-programming/2d-rotated-rectangle-collision-r2604

/**
 * A rectangle hitbox model for the purpose of collision detection
 */
export interface RectangleModel {
  width: number;
  height: number;
  center: Vec2d;
  direction: number;
}

/**
 * Four points in the game world that define a rectangle.
 */
export interface RectanglePoints {
  upperLeft: Vec2d;
  upperRight: Vec2d;
  lowerRight: Vec2d;
  lowerLeft: Vec2d;
}

/**
 * Gets the points of a rectangle model as it would appear on a graph with no rotation
 * @param rect Rectangle model to get the points of
 */
function getRectanglePoints(rect: RectangleModel): RectanglePoints {
  const halfWidth = Math.round(rect.width / 2);
  const halfHeight = Math.round(rect.height / 2);
  //TODO: update this so it works relative to rect center and not 0,0
  return {
    upperLeft: { x: rect.center.x - halfWidth, y: rect.center.y + halfHeight },
    upperRight: { x: rect.center.x + halfWidth, y: rect.center.y + halfHeight },
    lowerRight: { x: rect.center.x + halfWidth, y: rect.center.y - halfHeight },
    lowerLeft: { x: rect.center.x - halfWidth, y: rect.center.y - halfHeight }
  };
}

function translatePoint(origin: Vec2d, translation: Vec2d): Vec2d {
  return {
    x: origin.x + translation.x,
    y: origin.y + translation.y
  };
}

/**
 * Rotate a point by the given angle
 * @param point The point to rotate
 * @param radians The angle at which to rotate the point
 */
function rotatePoint(point: Vec2d, radians: number): Vec2d {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  };
}

/**
 * Returns points of the rectangle factoring in the direction
 * @param rect The Rectangle to get the points for
 */
export function getRotatedRectanglePoints(
  rect: RectangleModel
): RectanglePoints {
  const offset = rect.center;
  rect.center = { x: 0, y: 0 };
  const radians = directionToRadians(rect.direction);
  const unrotated = getRectanglePoints(rect);
  rect.center = offset;

  const r: RectanglePoints = {
    upperLeft: rotatePoint(unrotated.upperLeft, radians),
    upperRight: rotatePoint(unrotated.upperRight, radians),
    lowerRight: rotatePoint(unrotated.lowerRight, radians),
    lowerLeft: rotatePoint(unrotated.lowerLeft, radians)
  };

  r.upperLeft = translatePoint(r.upperLeft, offset);
  r.upperRight = translatePoint(r.upperRight, offset);
  r.lowerRight = translatePoint(r.lowerRight, offset);
  r.lowerLeft = translatePoint(r.lowerLeft, offset);

  return r;
}
