import { Team } from "../constants";
import { Entity, EntityType } from "../entity";
import { CacheEntry, Cache } from "../network/cache";
import { GameWorld } from "../world/world";

export class Flag extends Entity {
  public type = EntityType.Flag;
  public x: number;
  public y: number;
  public team: Team;

  public constructor(id: number, world: GameWorld, cache: Cache) {
    super(id, world);
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
