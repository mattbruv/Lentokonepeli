import { EntityEvent, GameEventType } from "./event";
import { PropertyType, Property, ByteSize } from "./constants";

export interface Entity {
  id: number;
  getState: () => EntityProperty[];
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

/**
 * Entity Property
 * Defines a property in an entity object
 * that can be serialized and sent.
 * Such properties are subject to change,
 * like (x, y), rotation, etc.
 */
export interface EntityProperty {
  key: string;
  propType: PropertyType;
  value: Property;
}

/**
 * A generic class to handle lists of entities.
 *
 * Usefull to have a generic ID function
 */
export class EntityContainer<E extends Entity> {
  private list: E[];
  private type: EntityType;

  public constructor(type: EntityType) {
    this.type = type;
    this.reset();
  }

  public reset(): void {
    this.list = [];
  }

  public add(instance: E): EntityEvent {
    instance.id = this.getUniqueID();
    // const state = instance.getState();
    this.list.push(instance);
    const event = {
      entityType: this.type,
      eventType: GameEventType.EntityAdd,
      entityId: instance.id
    };
    return event;
  }

  public delete(id: number): EntityEvent {
    let index = ByteSize.TWO_BYTES;
    for (let i = 0; i < this.list.length; i++) {
      if (this.list[i].id == id) {
        index = i;
        break;
      }
    }
    this.list.splice(index, 1);
    const event = {
      entityType: this.type,
      eventType: GameEventType.EntityDelete,
      entityId: id
    };
    return event;
  }

  public get(): E[] {
    return this.list;
  }

  private getUniqueID(): number {
    const used = this.list.map((e: E): number => e.id);
    for (let id = 0; id <= ByteSize.TWO_BYTES; id++) {
      if (!used.includes(id)) {
        return id;
      }
    }
    return ByteSize.TWO_BYTES;
  }
}
