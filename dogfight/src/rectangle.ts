// Collision detection for rotated rectangles
// relies on the Separating Axis Theorem described here:
// https://www.gamedev.net/articles/programming/general-and-gameplay-programming/2d-rotated-rectangle-collision-r2604

/**
 * A position in the game world.
 */
export interface Vec2d {
  x: number;
  y: number;
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
 * A rectangle hitbox model for the purpose of collision detection
 */
export interface RectangleModel {
  width: number;
  height: number;
  center: Vec2d;
  direction: number;
}
