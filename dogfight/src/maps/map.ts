import { Entity } from "../entities/entity";
import { getUniqueEntityID } from "../engine/world";
import { HillOptions, createHill } from "../entities/hill";
import { RunwayOptions, createRunway } from "../entities/runway";
import { createWater, WaterOptions } from "../entities/water";
import { createGround, GroundOptions } from "../entities/ground";

export interface MapDefinition {
  grounds: GroundOptions[];
  waters: WaterOptions[];
  hills: HillOptions[];
  runways: RunwayOptions[];
}

export function entitiesFromMap(mapData: MapDefinition): Entity[] {
  const entities = [];

  mapData.waters.map((entry: WaterOptions): void => {
    const water = createWater(entry, getUniqueEntityID(entities));
    entities.push(water);
  });

  mapData.grounds.map((entry: GroundOptions): void => {
    const ground = createGround(entry, getUniqueEntityID(entities));
    entities.push(ground);
  });

  mapData.hills.map((entry: HillOptions): void => {
    const hill = createHill(entry, getUniqueEntityID(entities));
    entities.push(hill);
  });

  mapData.runways.map((entry: RunwayOptions): void => {
    const runway = createRunway(entry, getUniqueEntityID(entities));
    entities.push(runway);
  });

  return entities;
}
