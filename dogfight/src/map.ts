import { GroundOptions, GroundEntity } from "./entities/ground";
import { Entity, getUniqueID } from "./entity";
import { WaterOptions, WaterEntity } from "./entities/water";
import { RunwayOptions, RunwayEntity } from "./entities/runway";
import { FlagOptions, FlagEntity } from "./entities/flag";
import { ControlTowerOptions, ControlTowerEntity } from "./entities/tower";
import { HillOptions, HillEntity } from "./entities/hill";

/**
 * A declaritive object that describes a level.
 * You can list all of the objects
 * that are to appear in this map here.
 */
export interface GameMap {
  grounds?: GroundOptions[];
  waters?: WaterOptions[];
  runways?: RunwayOptions[];
  flags?: FlagOptions[];
  towers?: ControlTowerOptions[];
  hills?: HillOptions[];
}

// Don't repeat yourself FAIL, lol. TODO: clean this up
export function loadMapEntities(mapData: GameMap, entities: Entity[]): void {
  if (mapData.grounds) {
    mapData.grounds.forEach((ground): void => {
      ground.id = getUniqueID(entities);
      const ent = new GroundEntity();
      ent.setOptions(ground);
      entities.push(ent);
    });
  }

  if (mapData.waters) {
    mapData.waters.forEach((water): void => {
      water.id = getUniqueID(entities);
      const ent = new WaterEntity();
      ent.setOptions(water);
      entities.push(ent);
    });
  }

  if (mapData.runways) {
    mapData.runways.forEach((runway): void => {
      runway.id = getUniqueID(entities);
      const ent = new RunwayEntity();
      ent.setOptions(runway);
      entities.push(ent);
    });
  }

  if (mapData.flags) {
    mapData.flags.forEach((flag): void => {
      flag.id = getUniqueID(entities);
      const ent = new FlagEntity();
      ent.setOptions(flag);
      entities.push(ent);
    });
  }

  if (mapData.towers) {
    mapData.towers.forEach((tower): void => {
      tower.id = getUniqueID(entities);
      const ent = new ControlTowerEntity();
      ent.setOptions(tower);
      entities.push(ent);
    });
  }

  if (mapData.hills) {
    mapData.hills.forEach((hill): void => {
      hill.id = getUniqueID(entities);
      const ent = new HillEntity();
      ent.setOptions(hill);
      entities.push(ent);
    });
  }
}
