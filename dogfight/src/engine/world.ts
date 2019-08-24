import { Player } from "../entities/player";
import { Entity } from "../entities/entity";
import { U16_MAX } from "../constants";

/**
 * An object that holds the state
 * of an entire game world.
 */
export interface World {
  players: Player[];
  entities: Entity[];
}

/**
 * Returns a unique Entity ID.
 * @param entities The list of entities to check for an ID
 */
export function getUniqueEntityID(entities: Entity[]): number {
  const idList = entities.map((e): number => e.id);
  for (let id = 0; id <= U16_MAX; id++) {
    if (!idList.includes(id)) {
      return id;
    }
  }
  return U16_MAX;
}

/**
 * Returns a unique Player ID.
 * @param players The list of players to check for a unique ID.
 */
export function getUniquePlayerID(players: Player[]): number {
  const idList = players.map((p): number => p.playerID);
  for (let id = 0; id <= U16_MAX; id++) {
    if (!idList.includes(id)) {
      return id;
    }
  }
  return U16_MAX;
}
