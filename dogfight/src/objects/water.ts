import { FacingDirection } from "../constants";
import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";
import { RectangleBody } from "../physics/rectangle";

export class Water extends GameObject {
  public type = GameObjectType.Water;

  public x: number;
  public y: number;
  public width: number;
  public direction: FacingDirection;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.setData(cache, {
      x: 0,
      y: 0,
      width: 500,
      direction: FacingDirection.Right
    });
  }

  public getRect(): RectangleBody {
    return {
      direction: 0,
      width: this.width,
      height: 1000,
      center: {
        x: this.x,
        y: this.y - 505
      }
    };
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
