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

//TODO use this as InputKey?
export enum GameKey {
  PLANE_UP,
  PLANE_DOWN,
  PLANE_SHOOT,
  PLANE_BOMB,
  PLANE_MOTOR,
  PLANE_FLIP,
  PLANE_JUMP,
  MAN_PARACHUTE,
  MAN_LEFT,
  MAN_RIGHT,
  MAN_SHOOT,
  MAN_SUICIDE,
  PLANE_CHOOSER_PREVIOUS_PLANE,
  PLANE_CHOOSER_NEXT_PLANE,
  PLANE_CHOOSER_PREVIOUS_RUNWAY,
  PLANE_CHOOSER_NEXT_RUNWAY,
  PLANE_CHOOSER_CHOOSE,
  TEAM_CHOOSER_PREVIOUS,
  TEAM_CHOOSER_NEXT,
  TEAM_CHOOSER_CHOOSE,
  INTERMISSION_READY,
  GHOST_PREVIOUS,
  GHOST_NEXT
}