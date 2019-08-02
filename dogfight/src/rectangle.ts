import {
  Vec2d,
  rotatePoint,
  translatePoint,
  directionToRadians
} from "./vector";

/**
 * A rectangle hitbox model for the purpose of collision detection
 */
export interface RectangleModel {
  width: number;
  height: number;
  center: Vec2d;
  direction: number;
}

export interface RectangleAxes {
  Axis1: Vec2d;
  Axis2: Vec2d;
}

type ProjectionPoints = number[];

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

export function getRectAxes(rect: RectanglePoints): RectangleAxes {
  return {
    Axis1: {
      x: rect.upperRight.x - rect.upperLeft.x,
      y: rect.upperRight.y - rect.upperLeft.y
    },
    Axis2: {
      x: rect.upperRight.x - rect.lowerRight.x,
      y: rect.upperRight.y - rect.lowerRight.y
    }
  };
}

// Step 2
export function projectPointToAxis(point: Vec2d, axis: Vec2d): Vec2d {
  // helper function to reduce typing
  const reduce = (point: Vec2d, axis: Vec2d): number => {
    const top = point.x * axis.x + point.y * axis.y;
    const bot = Math.pow(axis.x, 2) + Math.pow(axis.y, 2);
    return top / bot;
  };
  return {
    x: reduce(point, axis) * axis.x,
    y: reduce(point, axis) * axis.y
  };
}

export function projectionToScalar(projection: Vec2d, axis: Vec2d): number {
  return projection.x * axis.x + projection.y * axis.y;
}

function getProjection(point: Vec2d, axis: Vec2d): number {
  return projectionToScalar(projectPointToAxis(point, axis), axis);
}

function projectRectangle(
  points: RectanglePoints,
  axis: Vec2d
): ProjectionPoints {
  return [
    getProjection(points.upperLeft, axis),
    getProjection(points.upperRight, axis),
    getProjection(points.lowerRight, axis),
    getProjection(points.lowerLeft, axis)
  ];
}

export function isCollisionOnAxis(
  axis: Vec2d,
  rA: RectanglePoints,
  rB: RectanglePoints
): boolean {
  const projectionA = projectRectangle(rA, axis);
  const projectionB = projectRectangle(rB, axis);
  const aMin = Math.min(...projectionA);
  const aMax = Math.max(...projectionA);
  const bMin = Math.min(...projectionB);
  const bMax = Math.max(...projectionB);

  if (bMin <= aMax && bMax >= aMin) {
    return true;
  }
  return false;
}
