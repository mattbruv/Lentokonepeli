import { Entity } from "../entities/entity";

/**
 * This file defines callbacks for the game engine.
 *
 * This will run functions that need to know when
 * state is updated, etc.
 */

export interface EngineCallbacks {
  onEntityAdd(newEntity: Entity): void;
  onEntityDelete(id: number): void;
}
