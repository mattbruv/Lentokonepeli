import { Vec2d } from "../physics/vector";
import { Facing, EntityType } from "../constants";
import { Entity } from "../entities/entity";
import { WaterEntity } from "../entities/water";
import { getUniqueEntityID } from "../world/world";
import { GroundEntity } from "../entities/ground";
import { HillEntity } from "../entities/hill";
import { RunwayEntity } from "../entities/runway";

export interface MapDefinition {
  grounds: GroundEntry[];
  waters: WaterEntry[];
  hills: HillEntry[];
  runways: RunwayEntry[];
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

export interface HillEntry {
  position: Vec2d;
}

export interface RunwayEntry {
  position: Vec2d;
  facing: Facing;
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

function createHill(entry: HillEntry, id: number): HillEntity {
  return {
    id,
    type: EntityType.Hill,
    position: entry.position
  };
}

function createRunway(entry: RunwayEntry, id: number): RunwayEntity {
  return {
    id,
    type: EntityType.Runway,
    position: entry.position,
    facing: entry.facing,
    hitbox: {
      width: 280,
      height: 10,
      center: { x: entry.position.x, y: entry.position.y - 5 },
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

  mapData.hills.map((entry: HillEntry): void => {
    const hill = createHill(entry, getUniqueEntityID(entities));
    entities.push(hill);
  });

  mapData.runways.map((entry: RunwayEntry): void => {
    const runway = createRunway(entry, getUniqueEntityID(entities));
    entities.push(runway);
  });

  return entities;
}
