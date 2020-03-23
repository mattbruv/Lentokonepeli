import { InputKey } from "../../dogfight/src/constants";

const keyMap = {
  Space: InputKey.Jump,
  ArrowLeft: InputKey.Left,
  ArrowRight: InputKey.Right,
  ArrowUp: InputKey.Up,
  ArrowDown: InputKey.Down,

  // Bomb controls
  ShiftLeft: InputKey.Bomb,
  ShiftRight: InputKey.Bomb,
  Period: InputKey.Bomb,
  KeyB: InputKey.Bomb,

  // Shoot controls
  ControlLeft: InputKey.Fire,
  ControlRight: InputKey.Fire,
  Minus: InputKey.Fire,

  // Enter
  Enter: InputKey.Enter
};

export class GameInput {
  private keyState;

  public constructor() {
    this.keyState = {};
    for (const key in keyMap) {
      this.keyState[key] = false;
    }
  }

  public getGameKey(event: KeyboardEvent): InputKey {
    return keyMap[event.code];
  }

  public isGameKey(event: KeyboardEvent): boolean {
    return keyMap[event.code] !== undefined;
  }
}
