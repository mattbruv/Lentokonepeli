import { EntityChange, ChangeType, Change } from "../change";
import { EntityType } from "../entity";

// Packs all changes from a game all at once
// Done before networking to send data.
export function packChanges(list: Change[]): number {
  // packs changes into byte array, returns it
  return 0;
}

export function packEntity(ent: EntityChange): void {
  // return some kind of byte array
}

// turns bytes into an entity Change
export function unpackEntity(blob: number): EntityChange {
  return {
    changeType: ChangeType.Entity,
    entityType: EntityType.Plane
  };
}
