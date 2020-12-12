import { Terrain } from "../constants";
import { TypedEntity, EntityType } from "../TypedEntity";
import { Cache, CacheEntry } from "../network/cache";

export class Hill extends TypedEntity {
  public type = EntityType.Hill;
  public x: number;
  public y: number;
  public terrain: Terrain;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.setData(cache, {
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
