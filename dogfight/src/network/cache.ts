import { GameObjectType } from "../object";
import { SendableType, GameObjectSchema, IntByteSizes } from "./types";

/**
 * A cache which holds data about all objects
 * that have had updates which need to be sent
 * out over the network.
 *
 * Indexed by a unique global object ID.
 */
export interface Cache {
  [key: number]: CacheEntry;
}

/**
 * A Cache entry, which consists of a game object
 * and properties to send.
 */
export interface CacheEntry {
  type: GameObjectType;
  [key: string]: SendableType;
}

export const foo: CacheEntry = {
  type: GameObjectType.Trooper,
  x: 0,
  y: 200,
  health: 255,
  state: 0,
  direction: 1,
  foo: true,
  bar: false
};

export function encodeCache(cache: Cache): void {
  let bytes = 0;
  console.log(cache);
  for (const entry in cache) {
    console.log(entry);
  }
}

export function encodeEntry(
  id: number,
  entry: CacheEntry,
  schema: GameObjectSchema
): void {
  console.log("pack id: ", id);
  console.log("with entry: ", entry);
  console.log("with schema: ", schema);
}

export function getEncodedSize(
  entry: CacheEntry,
  schema: GameObjectSchema
): number {
  let totalSize = 0;

  const bitmaskBytes = Math.ceil(
    (schema.numbers.length + schema.booleans.length) / 8
  );

  schema.numbers.forEach((n): void => {
    if (n.name in entry) {
      const size = IntByteSizes[n.intType];
      totalSize += size;
    }
  });

  const boolBytes = Math.ceil(schema.booleans.length / 8);

  totalSize += bitmaskBytes + boolBytes;

  return totalSize;
}
