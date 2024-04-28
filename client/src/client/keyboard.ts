import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";

export class Keyboard {
  private keyboard: PlayerKeyboard = {
    left: false,
    right: false,
    down: false,
    up: false,
    shift: false,
    space: false,
    enter: false,
  };

  public onKeyDown(key: string) {
    const keyAlreadyPressed = this.keysDown.has(key);

    if (!keyAlreadyPressed) {
      this.keysDown.add(key);
      console.log(this.keysDown);
    }
  }

  public onKeyUp(key: string) {
    this.keysDown.delete(key);
    console.log(this.keysDown);
  }
}
