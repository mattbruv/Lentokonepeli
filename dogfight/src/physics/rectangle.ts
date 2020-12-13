import { Vec2d, rotatePoint, translatePoint } from "./vector";
import { directionToRadians } from "./helpers";
import { isRectangleCollision } from "./collision";

export class Rectangle {
  public width: number;
  public height: number;
  public y: number;
  public x: number;
  public constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public body(): RectangleBody {
    return {
      center: { x: this.x, y: this.y },
      direction: 0,
      height: this.height,
      width: this.width
    };
  }
  public getHeight() {
    return this.height;
  }
  public getWidth() {
    return this.width;
    }

  public getMinX() {
    return this.x - this.width / 2;
  }
  public getMaxX() {
    return this.x + this.width / 2;
  }
  public getMinY() {
    return this.y - this.height / 2;
  }
  public getMaxY() {
    return this.y + this.height / 2;
  }

  public intersects(r: Rectangle): boolean {
    return isRectangleCollision(this.body(), r.body())
  }
  public intersection(r: Rectangle): Rectangle {
    const x1 = Math.max(this.getMinX(), r.getMinX());
    //const x1 = Math.max(this.x - this.width / 2, r.x - r.width / 2);
    const y1 = Math.max(this.getMinY(), r.getMinY());

    const x2 = Math.min(this.getMaxX(), r.getMaxX());
    const y2 = Math.min(this.getMaxY(), r.getMaxY());

    return new Rectangle(x1 + (x2 - x1) / 2, y1 + (y2 - y1) / 2, x2 - x1, y2 - y1);
  }
}
/**
 * A rectangle hitbox model for the purpose of collision detection
 */
export interface RectangleBody {
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
function getRectOriginPoints(rect: RectangleBody): RectanglePoints {
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
export function getRotatedRectPoints(rect: RectangleBody): RectanglePoints {
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
