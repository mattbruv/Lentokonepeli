import { GameObject, GameObjectType } from "../object";
import { CacheEntry, Cache } from "../network/cache";
import { Team } from "../constants";

export class Player extends GameObject {
  public type = GameObjectType.Player;
  public name: string;
  public controlType: GameObjectType;
  public controlID: number;
  public team: Team;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.name = "Player_" + this.id;
    this.controlID = -1;
    this.team = Team.Spectator;
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      name: this.name,
      team: this.team
    };
  }
}
