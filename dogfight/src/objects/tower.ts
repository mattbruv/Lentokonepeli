import { FacingDirection, Terrain } from "../constants";
import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";

export class Tower extends GameObject {
  public type = GameObjectType.ControlTower;

  public x: number;
  public y: number;
  public terrain: Terrain;
  public direction: FacingDirection;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.setData(cache, {
      x: 0,
      y: 0,
      terrain: Terrain.Normal,
      direction: FacingDirection.Right
    });
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      terrain: this.terrain,
      direction: this.direction
    };
  }
}
