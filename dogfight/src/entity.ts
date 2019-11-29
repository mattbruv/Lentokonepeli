import { ByteSize } from "./constants";
import { Properties } from "./state";

export interface Entity {
  id: number;
  readonly type: EntityType;
  getState: () => Properties;
}

/**
 * Constants for each type of Entity in the game.
 */
export enum EntityType {
  Ground,
  Water,
  Runway,
  Flag,
  ControlTower
}

export function getUniqueID(list: Entity[]): number {
  const idsInUse = list.map((e): number => e.id);
  for (let i = 0; i < ByteSize.TWO_BYTES; i++) {
    if (idsInUse.includes(i) == false) {
      return i;
    }
  }
  return ByteSize.TWO_BYTES;
}
