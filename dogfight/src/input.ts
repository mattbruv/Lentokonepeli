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

export interface PlayerInput {
  [key: number]: boolean;
}

export interface InputChange {
  key: InputKey;
  isPressed: boolean;
}
