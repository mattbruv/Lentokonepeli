import { Vec2d } from "../physics/vector";
import { Entity } from "./entity";
import { RectangleModel } from "../physics/rectangle";
import { Facing, EntityType } from "../constants";

export enum ManStatus {
  Parachuting,
  Walking
}

const HITBOX_HEIGHT = 10;
const HITBOX_WIDTH = 10;

const HITBOX_PARACHUTE_HEIGHT = 34;
const HITBOX_PARACHUTE_WIDTH = 24;

export interface ManEntity extends Entity {
  position: Vec2d;
  facing: Facing;
  status: ManStatus;
  hitbox: RectangleModel;
}

export interface ManOptions {
  position: Vec2d;
  facing: Facing;
  status: ManStatus;
}

function genManHitbox(pos: Vec2d, status: ManStatus): RectangleModel {
  let hitWidth: number;
  let hitHeight: number;

  switch (status) {
    case ManStatus.Parachuting:
      hitWidth = HITBOX_PARACHUTE_WIDTH;
      hitHeight = HITBOX_PARACHUTE_HEIGHT;
      break;
    case ManStatus.Walking:
      hitWidth = HITBOX_WIDTH;
      hitHeight = HITBOX_HEIGHT;
      break;
  }

  return {
    width: hitWidth,
    height: hitHeight,
    center: { x: pos.x, y: pos.y + Math.round(hitHeight / 2) },
    direction: 0
  };
}

export function createMan(entry: ManOptions, id: number): ManEntity {
  return {
    id,
    type: EntityType.Man,
    position: entry.position,
    facing: entry.facing,
    status: entry.status,
    hitbox: genManHitbox(entry.position, entry.status)
  };
}
