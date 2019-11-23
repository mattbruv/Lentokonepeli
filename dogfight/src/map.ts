import { GroundOptions, GroundEntity } from "./entities/ground";
import { Entity, getUniqueID } from "./entity";

/**
 * A declaritive object that describes a level.
 * You can list all of the objects
 * that are to appear in this map here.
 */
export interface GameMap {
  grounds?: GroundOptions[];
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
}
