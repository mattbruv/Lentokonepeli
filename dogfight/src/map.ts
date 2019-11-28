import { GroundOptions, GroundEntity } from "./entities/ground";
import { Entity, getUniqueID } from "./entity";
import { WaterOptions, WaterEntity } from "./entities/water";
import { RunwayOptions, RunwayEntity } from "./entities/runway";

/**
 * A declaritive object that describes a level.
 * You can list all of the objects
 * that are to appear in this map here.
 */
export interface GameMap {
  grounds?: GroundOptions[];
  waters?: WaterOptions[];
  runways?: RunwayOptions[];
}

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
}
