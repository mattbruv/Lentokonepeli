import * as PIXI from "pixi.js";
import { Vec2d } from "../../../dogfight/src/physics/vector";

export function toGameCoords(pixiPoint: PIXI.Point): Vec2d {
  return {
    x: Math.round(pixiPoint.x),
    y: Math.round(pixiPoint.y * -1)
  };
}

export function toPixiCoords(gameCoords: Vec2d): Vec2d {
  return {
    x: Math.round(gameCoords.x),
    y: Math.round(gameCoords.y * -1)
  };
}
