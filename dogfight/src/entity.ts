export interface Entity {
  entityType: EntityType;
  entityID: number;
}

/**
 * Constants for each type of Entity in the game.
 */
export enum EntityType {
  Ground,
  Plane,
  Pilot,
  Runway,
  Hill,
  Bomb,
  Explosion
}
