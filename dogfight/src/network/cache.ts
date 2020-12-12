import { EntityType } from "../entity";
import { SendableType } from "./types";

/**
 * A cache which holds data about all objects
 * that have had updates which need to be sent
 * out over the network.
 *
 * Indexed by a unique global object ID.
 */
export interface Cache {
  [key: number]: {
    [key: number]: CacheEntry;
  };
}

/**
 * A Cache entry, which consists of a game object
 * and properties to send.
 */
export interface CacheEntry {
  type: EntityType;
  [key: string]: SendableType;
}

export const foo: CacheEntry = {
  type: EntityType.Trooper,
  x: 0,
  y: 200,
  health: 255,
  state: 0,
  direction: 1,
  foo: true,
  bar: false
};
