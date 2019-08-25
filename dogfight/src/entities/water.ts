import { Vec2d } from "../physics/vector";
import { Entity } from "./entity";
import { Facing, EntityType } from "../constants";
import { RectangleModel } from "../physics/rectangle";

const HITBOX_HEIGHT = 1000;

export interface WaterEntity extends Entity {
  /** The position of the water. Anchored in the center. */
  position: Vec2d;
  width: number;
  waveDirection: Facing;
  hitbox: RectangleModel;
}

export interface WaterOptions {
  position: Vec2d;
  width: number;
  waveDirection: Facing;
}

function genWaterHitbox(pos: Vec2d, width: number): RectangleModel {
  return {
    width,
    height: HITBOX_HEIGHT,
    center: { x: pos.x, y: pos.y - Math.round(HITBOX_HEIGHT / 2) },
    direction: 0
  };
}

export function createWater(entry: WaterOptions, id: number): WaterEntity {
  return {
    id,
    type: EntityType.Water,
    position: entry.position,
    width: entry.width,
    waveDirection: entry.waveDirection,
    hitbox: genWaterHitbox(entry.position, entry.width)
  };
}
