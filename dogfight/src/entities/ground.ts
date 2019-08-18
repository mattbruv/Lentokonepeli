import { Vec2d } from "../physics/vector";
import { Entity } from "./entity";
import { RectangleModel } from "../physics/rectangle";

export interface GroundEntity extends Entity {
  position: Vec2d;
  width: number;
  hitbox: RectangleModel;
}
