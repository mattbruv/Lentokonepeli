import { Vec2d } from "../physics/vector";
import { Entity } from "./entity";
import { RectangleModel } from "../physics/rectangle";
import { EntityType } from "../constants";

export enum ManStatus {
  Parachuting,
  Falling,
  Standing,
  WalkingLeft,
  WalkingRight
}

const HITBOX_HEIGHT = 10;
const HITBOX_WIDTH = 10;

const HITBOX_PARACHUTE_HEIGHT = 30;
const HITBOX_PARACHUTE_WIDTH = 20;

export interface ManEntity extends Entity {
  position: Vec2d;
  status: ManStatus;
  hitbox: RectangleModel;
}

export interface ManOptions {
  position: Vec2d;
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
    default:
      hitWidth = HITBOX_WIDTH;
      hitHeight = HITBOX_HEIGHT;
      break;
  }

  return {
    width: hitWidth,
    height: hitHeight,
    center: { x: pos.x + 1, y: pos.y + Math.round(hitHeight / 2) + 1 },
    direction: 0
  };
}

export function createMan(entry: ManOptions, id: number): ManEntity {
  return {
    id,
    type: EntityType.Man,
    position: entry.position,
    status: entry.status,
    hitbox: genManHitbox(entry.position, entry.status)
  };
}

export function moveMan(man: ManEntity): Partial<ManEntity> {
  const update: Partial<ManEntity> = {
    id: man.id,
    position: { x: man.position.x, y: man.position.y }
  };

  switch (man.status) {
    case ManStatus.Parachuting:
      update.position.y -= 1;
      break;
    case ManStatus.Falling:
      update.position.y -= 3;
      break;
  }

  update.hitbox = genManHitbox(update.position, man.status);
  return update;
}
