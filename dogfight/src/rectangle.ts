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

export function rectFromDimensions(
  center: Vec2d,
  width: number,
  height: number
): Rectangle {
  const halfWidth = Math.round(width / 2);
  const halfHeight = Math.round(height / 2);
  const rect: Rectangle = {
    upperLeft: { x: center.x - halfWidth, y: center.y + halfHeight },
    upperRight: { x: center.x + halfWidth, y: center.y + halfHeight },
    lowerRight: { x: center.x + halfWidth, y: center.y - halfHeight },
    lowerLeft: { x: center.x - halfWidth, y: center.y - halfHeight }
  };
  return rect;
}
