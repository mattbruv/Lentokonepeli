import { Vec2d } from "../physics/vector";
import { Entity } from "./entity";
import { Facing } from "../constants";
import { RectangleModel } from "../physics/rectangle";

export interface WaterEntity extends Entity {
  /** The position of the water. Anchored in the center. */
  position: Vec2d;
  width: number;
  waveDirection: Facing;
  hitbox: RectangleModel;
}
