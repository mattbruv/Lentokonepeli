import { Vec2d } from "../physics/vector";
import { Entity } from "./entity";
import { RectangleModel } from "../physics/rectangle";
import { EntityType } from "../constants";

const HITBOX_HEIGHT = 100;

export interface GroundEntity extends Entity {
  position: Vec2d;
  width: number;
  hitbox: RectangleModel;
}

export interface GroundOptions {
  position: Vec2d;
  width: number;
}

function genGroundHitbox(pos: Vec2d, width: number): RectangleModel {
  return {
    width,
    height: HITBOX_HEIGHT,
    center: { x: pos.x, y: pos.y - Math.round(HITBOX_HEIGHT / 2) },
    direction: 0
  };
}

export function createGround(entry: GroundOptions, id: number): GroundEntity {
  return {
    id,
    type: EntityType.Ground,
    position: entry.position,
    width: entry.width,
    hitbox: genGroundHitbox(entry.position, entry.width)
  };
}
