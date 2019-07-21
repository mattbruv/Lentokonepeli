import {
  Vec2d,
  rotatePoint,
  translatePoint,
  directionToRadians
} from "./vector";

// Collision detection and modeling for rotated rectangles
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
function getRectOriginPoints(rect: RectangleModel): RectanglePoints {
  const halfWidth = Math.round(rect.width / 2);
  const halfHeight = Math.round(rect.height / 2);
  //TODO: update this so it works relative to rect center and not 0,0
  return {
    upperLeft: { x: -halfWidth, y: halfHeight },
    upperRight: { x: halfWidth, y: halfHeight },
    lowerRight: { x: halfWidth, y: -halfHeight },
    lowerLeft: { x: -halfWidth, y: -halfHeight }
  };
}

/**
 * Returns points of the rectangle factoring in the direction
 * @param rect The Rectangle to get the points for
 */
export function getRotatedRectPoints(rect: RectangleModel): RectanglePoints {
  const offset = rect.center; // Original rect offset to translate back
  const radians = directionToRadians(rect.direction);
  const unrotated = getRectOriginPoints(rect);
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
