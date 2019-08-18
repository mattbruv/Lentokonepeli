import { Vec2d } from "../../../dogfight/src/physics/vector";

/**
 * Turns a coordinate position from the game world
 * into a position that PIXI can plot.
 * @param gameCoords The (x, y) coordinates of an object in the game world.
 * @returns The translated (x, y) position for PIXI.js
 */
export function toPixiCoords(gameCoords: Vec2d): Vec2d {
  return {
    x: gameCoords.x,
    y: gameCoords.y * -1
  };
}
