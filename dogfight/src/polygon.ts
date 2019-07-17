// https://www.youtube.com/watch?v=7Ik2vowGcU0

/**
 * A position in the game world
 */
export interface Vec2d {
  x: number;
  y: number;
}

/**
 * A model of a convex polygon
 * used for collision detection
 */
export interface Polygon {
  /**
   * A list of the polygon's points transformed by an angle
   */
  points: Vec2d[];
  /**
   * The centered position of the polygon in the game world
   */
  position: Vec2d;
  /**
   * The direction that the polygon is facing
   */
  angle: number;
  /**
   * Original list of points that forms a model of the polygon
   */
  model: Vec2d[];
}
