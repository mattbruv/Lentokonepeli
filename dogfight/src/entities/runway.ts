import { Vec2d } from "../physics/vector";
import { Entity } from "./entity";
import { RectangleModel } from "../physics/rectangle";
import { Facing, EntityType } from "../constants";

const HITBOX_HEIGHT = 10;
const HITBOX_WIDTH = 280;

export interface RunwayEntity extends Entity {
  position: Vec2d;
  facing: Facing;
  hitbox: RectangleModel;
}

export interface RunwayOptions {
  position: Vec2d;
  facing: Facing;
}

function genRunwayHitbox(pos: Vec2d, width: number): RectangleModel {
  return {
    width,
    height: HITBOX_HEIGHT,
    center: { x: pos.x, y: pos.y - Math.round(HITBOX_HEIGHT / 2) },
    direction: 0
  };
}

export function createRunway(entry: RunwayOptions, id: number): RunwayEntity {
  return {
    id,
    type: EntityType.Runway,
    position: entry.position,
    facing: entry.facing,
    hitbox: genRunwayHitbox(entry.position, HITBOX_WIDTH)
  };
}
