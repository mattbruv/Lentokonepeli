import { EntityEvent } from "./event";

export interface Entity {
  id: number;
  getState: () => EntityEvent;
}

/**
 * Constants for each type of Entity in the game.
 */
export enum EntityType {
  Ground,
  Water,
  Pilot,
  Plane,
  Runway,
  Hill,
  Bomb,
  Explosion
}

export interface EntityInfo {
  maxAllowed: number;
  /*
   * Properties of an entity that are able
   * to be packed should be listed here.
   *
   * ex: {
   *      "x": ByteSize.TWO_BYTES,
   *      "health": ByteSize.ONE_BYTE
   *     }
   */
}

/**
 * A generic class to handle lists of entities.
 *
 * Usefull to have a generic ID function
 */
export class EntityContainer<Ent extends Entity> {
  private list: Ent[];
  private info: EntityInfo;

  public constructor(info: EntityInfo) {
    this.info = info;
    this.reset();
  }

  public reset(): void {
    this.list = [];
  }

  public add(instance: Ent): EntityEvent {
    const id = this.getUniqueID();
    if (id >= 0) {
      instance.id = id;
      const state = instance.getState();
      this.list.push(instance);
      return state;
    }
  }

  public get(): Ent[] {
    return this.list;
  }

  private getUniqueID(): number {
    const max = this.info.maxAllowed;
    const used = this.list.map((e: Ent): number => e.id);
    for (let id = 0; id <= max; id++) {
      if (!used.includes(id)) {
        return id;
      }
    }
    return -1;
  }
}
