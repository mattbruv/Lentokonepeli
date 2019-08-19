import { Vec2d } from "../physics/vector";
import { Entity } from "./entity";

export interface HillEntity extends Entity {
  position: Vec2d;
}
