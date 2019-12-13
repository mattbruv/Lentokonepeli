import { GameObjectData, GameObjectInfo } from "./object";

export enum StateAction {
  Create,
  Update,
  Delete
}

export interface Change extends GameObjectInfo {
  data: GameObjectData;
}

/**
 * An object which holds a snapshot of game data.
 *
 * This could be full information about a game state,
 * or simply changes to existing objects.
 *
 * It is a nested object, indexed first by
 * game object type, then by the ID of that game object.
 *
 * It holds the action to apply, and the data to update.
 */
export interface GameState {
  /** Game Object Type */
  [type: number]: {
    [id: number]: {
      action: StateAction;
      data: GameObjectData;
    };
  };
}
