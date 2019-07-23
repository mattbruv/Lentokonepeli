import { Vec2d } from "./vector";
import { RectanglePoints } from "./rectangle";

interface RectangleAxes {
  Axis1: Vec2d;
  Axis2: Vec2d;
}

type ProjectionPoints = number[];

// Collision detection and modeling for rotated rectangles
// relies on the Separating Axis Theorem described here:
// https://www.gamedev.net/articles/programming/general-and-gameplay-programming/2d-rotated-rectangle-collision-r2604

function getRectAxes(rect: RectanglePoints): RectangleAxes {
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
function projectPointToAxis(point: Vec2d, axis: Vec2d): Vec2d {
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

function projectionToScalar(projection: Vec2d, axis: Vec2d): number {
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

function isCollisionOnAxis(
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

export function isRectangleCollision(
  rectA: RectanglePoints,
  rectB: RectanglePoints
): boolean {
  const rectAAxes = getRectAxes(rectA);
  const rectBAxes = getRectAxes(rectB);

  const axes = [
    rectAAxes.Axis1,
    rectAAxes.Axis2,
    rectBAxes.Axis1,
    rectBAxes.Axis2
  ];

  for (let i = 0; i < axes.length; i++) {
    const axis = axes[i];
    if (!isCollisionOnAxis(axis, rectA, rectB)) {
      return false;
    }
  }

  return true;
}
