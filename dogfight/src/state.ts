export enum StateAction {
  Create,
  Update,
  Delete
}

type sendableData = number;

/**
 * Properties from a game object.
 * Can be virtually anything non-nested
 * that can be assigned to a key.
 */
export interface Properties {
  [key: string]: sendableData;
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
      data: Properties;
    };
  };
}
