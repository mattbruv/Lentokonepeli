// https://www.gamedev.net/articles/programming/general-and-gameplay-programming/2d-rotated-rectangle-collision-r2604

/**
 * A position in the game world
 */
export interface Vec2d {
  x: number;
  y: number;
}

export interface Rectangle {
  upperLeft: Vec2d;
  upperRight: Vec2d;
  lowerRight: Vec2d;
  lowerLeft: Vec2d;
}
