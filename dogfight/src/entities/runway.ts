import { Vec2d } from "../physics/vector";
import { Entity } from "./entity";
import { RectangleModel } from "../physics/rectangle";
import { Facing } from "../constants";

export interface RunwayEntity extends Entity {
  position: Vec2d;
  facing: Facing;
  hitbox: RectangleModel;
}
