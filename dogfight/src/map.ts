import { GroundProperties } from "./objects/ground";
import { WaterProperties } from "./objects/water";
import { RunwayProperties } from "./objects/runway";
import { FlagProperties } from "./objects/flag";
import { TowerProperties } from "./objects/tower";
import { HillProperties } from "./objects/hill";

/**
 * A declaritive object that describes a level.
 * You can list all of the objects
 * that are to appear in this map here.
 */
export interface GameMap {
  grounds: Partial<GroundProperties>[];
  waters: Partial<WaterProperties>[];
  runways: Partial<RunwayProperties>[];
  flags: Partial<FlagProperties>[];
  towers: Partial<TowerProperties>[];
  hills: Partial<HillProperties>[];
}
