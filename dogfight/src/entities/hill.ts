import { Vec2d } from "../physics/vector";
import { Entity } from "./entity";
import { EntityType } from "../constants";

export interface HillEntity extends Entity {
  position: Vec2d;
}

export interface HillOptions {
  position: Vec2d;
}

export function createHill(entry: HillOptions, id: number): HillEntity {
  return {
    id,
    type: EntityType.Hill,
    position: entry.position
  };
}
