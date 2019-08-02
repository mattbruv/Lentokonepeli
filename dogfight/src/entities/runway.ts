import { Vec2d } from "../physics/vector";
import { Facing, Team } from "../constants";
import { Health } from "./interfaces";

/** An object that represents an airplane runway in the game. */
export interface Runway extends Health {
  id: number;
  position: Vec2d;
  facing: Facing;
  team: Team;
}
