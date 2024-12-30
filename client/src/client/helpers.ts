import * as PIXI from "pixi.js";
import { Point } from "./entities/entity";

export function directionToRadians(direction: number): number {
  const degrees = (direction / 255) * 360
  return degrees * (Math.PI / 180)
}

export function toGamePoint(pixiPoint: PIXI.Point): Point {
  return {
    x: Math.round(pixiPoint.x),
    y: Math.round(pixiPoint.y * -1),
  };
}

export function toPixiPoint(gamePoint: Point): PIXI.Point {
  const x = Math.round(gamePoint.x);
  const y = Math.round(gamePoint.y * -1);
  return new PIXI.Point(x, y);
}
