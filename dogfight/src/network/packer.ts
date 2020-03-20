import { CacheEntry, Cache } from "./cache";
import { GameObjectSchema, IntByteSizes } from "./types";

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
