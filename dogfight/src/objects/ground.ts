import { Terrain } from "../constants";
import { GameObject, GameObjectType } from "../object";
import { CacheEntry, Cache } from "../network/cache";

export class Ground extends GameObject {
  public type = GameObjectType.Ground;
  public x: number;
  public y: number;
  public width: number;
  public terrain: Terrain;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.setData(cache, {
      x: 0,
      y: 0,
      width: 0,
      terrain: Terrain.Normal
    });
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      terrain: this.terrain
    };
  }
}
