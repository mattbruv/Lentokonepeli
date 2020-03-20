import { FacingDirection } from "../constants";
import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";

export class Water extends GameObject {
  public type = GameObjectType.Water;

  public x: number;
  public y: number;
  public width: number;
  public direction: FacingDirection;

  public constructor(id: number, cache: Cache) {
    super(id, cache);
    this.setData({
      x: 0,
      y: 0,
      width: 500,
      direction: FacingDirection.Right
    });
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      direction: this.direction
    };
  }
}
