import { GroundOptions } from "./entities/ground";

/**
 * A declaritive object that describes a level.
 * You can list all of the objects
 * that are to appear in this map here.
 */
export interface GameMap {
  grounds?: GroundOptions[];
}
