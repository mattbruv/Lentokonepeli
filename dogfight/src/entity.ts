import { ByteSize } from "./constants";
import { Properties } from "./state";

export interface GameObject {
  type: GameObjectType;
  id: number;
  getProperties(): Properties;
}

/**
 * Constants for each type of Entity in the game.
 */
export enum GameObjectType {
  Ground,
  Water,
  Runway,
  Flag,
  ControlTower,
  Hill,
  Trooper
}

export function getUniqueID(list: GameObject[]): number {
  const idsInUse = list.map((obj): number => obj.id);
  for (let i = 0; i < ByteSize.ONE_BYTE; i++) {
    if (idsInUse.includes(i) == false) {
      return i;
    }
  }
  return ByteSize.ONE_BYTE;
}
