import { GameObject, GameObjectType } from "../object";
import { CacheEntry, Cache } from "../network/cache";
import { Team } from "../constants";
import { PlayerInput, InputKey } from "../input";

export enum PlayerStatus {
  Playing,
  Takeoff,
  Spectating
}

export class Player extends GameObject {
  public type = GameObjectType.Player;
  public name: string;
  public team: Team;
  public controlType: GameObjectType;
  public controlID: number;
  public status: PlayerStatus;

  public inputState: PlayerInput;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.name = "Player_" + this.id;
    this.controlType = GameObjectType.None;
    this.controlID = 0;
    this.team = Team.Spectator;
    this.setStatus(cache, PlayerStatus.Takeoff);

    // initialize player input to all false.
    this.inputState = {};
    for (const keyIndex in InputKey) {
      this.inputState[keyIndex] = false;
    }
  }

  public setStatus(cache: Cache, status: PlayerStatus): void {
    this.set(cache, "status", status);
  }

  public setControl(
    cache: Cache,
    controlType: GameObjectType,
    controlID: number
  ): void {
    this.set(cache, "controlType", controlType);
    this.set(cache, "controlID", controlID);
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      name: this.name,
      team: this.team,
      controlType: this.controlType,
      controlID: this.controlID,
      status: this.status
    };
  }
}
