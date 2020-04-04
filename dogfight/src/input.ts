export enum InputKey {
  Left,
  Right,
  Up,
  Down,
  Fire,
  Bomb,
  Jump,
  Enter
}

/**
 * A Queue of inputs to apply each tick,
 * indexed by player ID.
 */
export interface InputQueue {
  [key: number]: KeyChangeList;
}

/**
 * indexed by game key type
 * returns state to apply
 */
export interface KeyChangeList {
  [key: number]: boolean;
}

export interface PlayerInput {
  [key: number]: boolean;
}

export interface InputChange {
  key: InputKey;
  isPressed: boolean;
}
