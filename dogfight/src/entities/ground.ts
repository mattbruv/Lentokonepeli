import { Vec2d } from "../physics/vector";

/**
 * An instance of ground in the game.
 */
export interface Ground {
  position: Vec2d;
  width: number;
}

/** 
export interface Runway extends Health {
  id: number;
  position: Vec2d;
  facing: Facing;
  team: Team;
}

*/
