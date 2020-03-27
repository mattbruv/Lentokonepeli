import { GameObject, GameObjectType } from "../object";
import { CacheEntry, Cache } from "../network/cache";
import { Team } from "../constants";

export class Player extends GameObject {
  public type = GameObjectType.Player;
  public name: string;
  public team: Team;
  public controlType: GameObjectType;
  public controlID: number;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.name = "Player_" + this.id;
    this.controlType = GameObjectType.None;
    this.controlID = 0;
    this.team = Team.Spectator;
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
      controlID: this.controlID
    };
  }
}
