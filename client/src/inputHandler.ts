import { InputChange, PlayerInput, InputKey } from "../../dogfight/src/input";

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

export class InputHandler {
  private playerInputState: PlayerInput;

  public processGameKeyChange: (change: InputChange) => void;

  public constructor() {
    this.playerInputState = {};
    // initialize all keys to false
    for (const keyIndex in InputKey) {
      this.playerInputState[keyIndex] = false;
    }
    // set callbacks
    document.addEventListener("keydown", (event): void => {
      this.onKeyDown(event);
    });
    document.addEventListener("keyup", (event): void => {
      this.onKeyUp(event);
    });
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.isGameKey(event)) {
      const key = this.getGameKey(event);
      const isKeyPressed = this.playerInputState[key];
      if (!isKeyPressed) {
        this.playerInputState[key] = true;
        this.processGameKeyChange({ key, isPressed: true });
      }
    }
    // eventually do something with client keys here,
    // things like typing a chat, etc.
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (this.isGameKey(event)) {
      const key = this.getGameKey(event);
      const isKeyPressed = this.playerInputState[key];
      if (isKeyPressed) {
        this.playerInputState[key] = false;
        this.processGameKeyChange({ key, isPressed: false });
      }
    }
  }

  private getGameKey(event: KeyboardEvent): InputKey {
    return keyMap[event.code];
  }

  private isGameKey(event: KeyboardEvent): boolean {
    return keyMap[event.code] !== undefined;
  }
}
