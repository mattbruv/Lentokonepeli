import { Vec2d } from "../../../dogfight/src/physics/vector";
import { EntityType } from "../../../dogfight/src/constants";
import { EntitySprite } from "./objects/entity";

/**
 * Turns a coordinate position from the game world
 * into a position that PIXI can plot.
 * @param gameCoords The (x, y) coordinates of an object in the game world.
 * @returns The translated (x, y) position for PIXI.js
 */
export function toPixiCoords(gameCoords: Vec2d): Vec2d {
  return {
    x: Math.round(gameCoords.x),
    y: Math.round(gameCoords.y * -1)
  };
}

/**
 * Turns a coordinate position from the PIXI world
 * into a game engine position
 * @param gameCoords The (x, y) coordinates of an object in the game world.
 * @returns The translated (x, y) position for PIXI.js
 */
export function toGameCoords(pixiCoords: Vec2d): Vec2d {
  return {
    x: Math.round(pixiCoords.x),
    y: Math.round(pixiCoords.y * -1)
  };
}
