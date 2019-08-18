import { EntityType } from "../constants";

/**
 * Basic details of an entity in the game world
 */
export interface Entity {
  /** A number from 0-65535 to uniquely identify this entity. */
  id: number;
  /** An entity type ranging from 0-255. Describes the entity. */
  type: EntityType;
}
