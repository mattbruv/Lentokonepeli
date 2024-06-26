import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";

const keyMap: Record<string, keyof PlayerKeyboard> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "down",
  ArrowUp: "up",
  " ": "space",
  Enter: "enter",
  Shift: "shift",
};

type keyboardChangeCallback = (keyboard: PlayerKeyboard) => void;

export class GameKeyboard {
  private keyboard: PlayerKeyboard = {
    left: false,
    right: false,
    down: false,
    up: false,
    shift: false,
    space: false,
    enter: false,
  };

  private onKeyChange?: keyboardChangeCallback;

  public init(callback: keyboardChangeCallback) {
    this.onKeyChange = callback;
  }

  public onKeyDown(keyString: string) {
    const inMap = keyString in keyMap;
    if (!inMap) return;
    const key = keyMap[keyString];
    const keyAlreadyPressed = this.keyboard[key];

    if (!keyAlreadyPressed) {
      this.keyboard[key] = true;
      if (this.onKeyChange) {
        this.onKeyChange(structuredClone(this.keyboard));
      }
    }
  }

  public onKeyUp(keyString: string) {
    const inMap = keyString in keyMap;
    if (!inMap) return;
    const key = keyMap[keyString];
    this.keyboard[key] = false;
    if (this.onKeyChange) {
      this.onKeyChange(structuredClone(this.keyboard));
    }
  }
}
