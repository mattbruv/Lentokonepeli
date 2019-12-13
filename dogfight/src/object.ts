import { ByteSize } from "./constants";

type sendableData = number | string;

export interface GameObjectInfo {
  id: number;
  type: GameObjectType;
}

/**
 * A generic game object class.
 *
 * Each game object has a type and unique ID.
 *
 * It also has a method to retrieve its current state.
 */
export abstract class GameObject<CustomProperties> implements GameObjectInfo {
  public type: GameObjectType;
  public id: number;

  public constructor(id: number, type: GameObjectType) {
    this.id = id;
    this.type = type;
  }

  public abstract getState(): GameObjectData;

  public setData(data: Partial<CustomProperties>): void {
    for (const key in data) {
      this[key as string] = data[key];
    }
  }
}

/**
 * Properties from a game object.
 * Can be virtually anything non-nested
 * that can be assigned to a key.
 */
export interface GameObjectData {
  [key: string]: sendableData;
}

/**
 * Constants for each type of object in the game.
 */
export enum GameObjectType {
  Ground,
  Water,
  Runway,
  Flag,
  ControlTower,
  Hill,
  Trooper,
  Player
}

export function getUniqueID(list: GameObjectInfo[]): number {
  const idsInUse = list.map((obj): number => obj.id);
  for (let i = 0; i < ByteSize.ONE_BYTE; i++) {
    if (idsInUse.includes(i) == false) {
      return i;
    }
  }
  return ByteSize.ONE_BYTE;
}
