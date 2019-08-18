import { Vec2d } from "../physics/vector";
import { Facing, EntityType } from "../constants";
import { Entity } from "../entities/entity";
import { WaterEntity } from "../entities/water";
import { getUniqueEntityID } from "../world/world";
import { GroundEntity } from "../entities/ground";

export interface MapDefinition {
  grounds: GroundEntry[];
  waters: WaterEntry[];
}

export interface WaterEntry {
  position: Vec2d;
  width: number;
  waveDirection: Facing;
}

export interface GroundEntry {
  position: Vec2d;
  width: number;
}

function createWater(entry: WaterEntry, id: number): WaterEntity {
  return {
    id,
    type: EntityType.Water,
    position: entry.position,
    width: entry.width,
    waveDirection: entry.waveDirection,
    hitbox: {
      width: entry.width,
      height: 1000,
      center: { x: entry.position.x, y: -500 },
      direction: 0
    }
  };
}

function createGround(entry: GroundEntry, id: number): GroundEntity {
  return {
    id,
    type: EntityType.Ground,
    position: entry.position,
    width: entry.width,
    hitbox: {
      width: entry.width,
      height: 1000,
      center: { x: entry.position.x, y: -500 },
      direction: 0
    }
  };
}

export function entitiesFromMap(mapData: MapDefinition): Entity[] {
  const entities = [];

  mapData.waters.map((entry: WaterEntry): void => {
    const water = createWater(entry, getUniqueEntityID(entities));
    entities.push(water);
  });

  mapData.grounds.map((entry: GroundEntry): void => {
    const ground = createGround(entry, getUniqueEntityID(entities));
    entities.push(ground);
  });

  return entities;
}
