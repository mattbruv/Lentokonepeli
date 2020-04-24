import {
  getRectAxes,
  isCollisionOnAxis,
  RectangleBody,
  getRotatedRectPoints
} from "./rectangle";
import { CircleBody } from "./circle";
import { Vec2d, rotatePoint, translatePoint } from "./vector";
import { directionToRadians } from "./helpers";

// Collision detection and modeling for rotated rectangles
// relies on the Separating Axis Theorem described here:
// https://www.gamedev.net/articles/programming/general-and-gameplay-programming/2d-rotated-rectangle-collision-r2604
/**
 * Determines if two rotated rectangles are colliding.
 * @param rectA Rectangle A
 * @param rectB Rectangle B
 */
export function isRectangleCollision(
  rectA: RectangleBody,
  rectB: RectangleBody
): boolean {
  const rectPointsA = getRotatedRectPoints(rectA);
  const rectPointsB = getRotatedRectPoints(rectB);
  const rectAAxes = getRectAxes(rectPointsA);
  const rectBAxes = getRectAxes(rectPointsB);
  const axes = [
    rectAAxes.Axis1,
    rectAAxes.Axis2,
    rectBAxes.Axis1,
    rectBAxes.Axis2
  ];
  for (let i = 0; i < axes.length; i++) {
    const axis = axes[i];
    if (!isCollisionOnAxis(axis, rectPointsA, rectPointsB)) {
      return false;
    }
  }
  return true;
}

/*
  Collision detection between Circle and Rotated Rectangle:
  Collision detection is done assuming the rectangle is at (0, 0),
  and that it is axis aligned (not rotated).
  We can simulate this without changing the rectangle's position/angle
  by assuming the rectangle is unrotated at 0,0 already.
  Then all we have to do is rotate the circle relative to 
  the unrotated rectangle.
  This is simply done by rotating the circle by the negative angle
  of the rectangle.
  The rest of the collision is calculated using a modified version
  of this algorithm found here:
  http://jeffreythompson.org/collision-detection/circle-rect.php
*/
/**
 * Determines if a circle is colliding with a rotated rectangle.
 * @param circle The circle model
 * @param rect The rectangle model
 */
export function isCircleRectCollision(
  circle: CircleBody,
  rect: RectangleBody
): boolean {
  const translation: Vec2d = {
    x: -rect.center.x,
    y: -rect.center.y
  };
  const circleTranslated = translatePoint(circle.center, translation);

  // Rotate the circle's center to be relative to rect
  const radians = directionToRadians(-rect.direction);
  const circlePos = rotatePoint(circleTranslated, radians);

  let testX = circlePos.x;
  let testY = circlePos.y;
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;

  if (circlePos.x < -halfWidth) {
    // Left edge
    testX = -halfWidth;
  } else if (circlePos.x > halfWidth) {
    // Right edge
    testX = halfWidth;
  }

  if (circlePos.y < -halfHeight) {
    // bottom edge
    testY = -halfHeight;
  } else if (circlePos.y > halfHeight) {
    // top edge
    testY = halfHeight;
  }
  const distX = circlePos.x - testX;
  const distY = circlePos.y - testY;
  const distance = Math.sqrt(distX * distX + distY * distY);

  return distance <= circle.radius ? true : false;
}

// The point/rectangle collision works very similarly to
// the circle/rectangle collision, except it is much more basic.
/**
 * Determines if a single point is colliding with a rotated rectangle.
 * @param point The point
 * @param rect The rectangle
 */
export function isPointRectCollision(
  point: Vec2d,
  rect: RectangleBody
): boolean {
  const translation: Vec2d = {
    x: -rect.center.x,
    y: -rect.center.y
  };
  const pointTranslated = translatePoint(point, translation);
  // Rotate the point's center to be relative to rect
  const radians = directionToRadians(-rect.direction);
  const pointLocal = rotatePoint(pointTranslated, radians);
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  if (
    pointLocal.x >= -halfWidth &&
    pointLocal.x <= halfWidth &&
    pointLocal.y >= -halfHeight &&
    pointLocal.y <= halfHeight
  ) {
    return true;
  }
  return false;
}

// TODO: Point/Circle collision for explosions
