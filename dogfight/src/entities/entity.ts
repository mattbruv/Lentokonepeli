import { EntityType, U16_MAX } from "../constants";
import { Player } from "./player";

/**
 * Basic details of an entity in the game world
 */
export interface Entity {
  /** A number from 0-65535 to uniquely identify this entity. */
  id: number;
  /** An entity type ranging from 0-255. Describes the entity. */
  type: EntityType;
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
