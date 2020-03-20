import { Terrain } from "../constants";
import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";

export class Hill extends GameObject {
  public type = GameObjectType.Hill;
  public x: number;
  public y: number;
  public terrain: Terrain;

  public constructor(id: number, cache: Cache) {
    super(id, cache);
    this.setData({
      x: 0,
      y: 0,
      terrain: Terrain.Normal
    });
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      terrain: this.terrain
    };
  }
}
