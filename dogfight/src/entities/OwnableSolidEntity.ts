import { Ownable } from "../ownable";
import { SolidEntity } from "./SolidEntity";
import { PlayerInfo } from "./PlayerInfo";
import { GameKey } from "../input";

export abstract class OwnableSolidEntity extends SolidEntity implements Ownable {
  private pressedKeys = [];
  abstract getPlayerInfo(): PlayerInfo;
  abstract getRootOwner(): Ownable;
  public isKeyPressed(key: GameKey): boolean { return this.pressedKeys[key] == undefined ? false : this.pressedKeys[key]; };
  public setKeyPressed(key: GameKey, value: boolean) { this.pressedKeys[key] = value; };
  public keyPressed(key: GameKey) { this.pressedKeys[key] = true; };
  public keyReleased(key: GameKey) { this.pressedKeys[key] = false; };
  public keyTyped(key: GameKey) { };
}