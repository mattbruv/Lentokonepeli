import { Team } from "../constants";
import { GameObject, GameObjectType } from "../object";
import { CacheEntry, Cache } from "../network/cache";

export class Flag extends GameObject {
  public type = GameObjectType.Flag;
  public x: number;
  public y: number;
  public team: Team;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.setData(cache, {
      x: 0,
      y: 0,
      team: Team.Centrals
    });
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      team: this.team
    };
  }
}
