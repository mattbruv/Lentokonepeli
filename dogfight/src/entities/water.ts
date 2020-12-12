import { FacingDirection } from "../constants";
import { TypedEntity, EntityType } from "../TypedEntity";
import { Cache, CacheEntry } from "../network/cache";
import { RectangleBody } from "../physics/rectangle";

export class Water extends TypedEntity {
  public type = EntityType.Water;

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

export function getWaterRect(
  x: number,
  y: number,
  width: number
): RectangleBody {
  return {
    direction: 0,
    width,
    height: 1000,
    center: {
      x,
      y: y - 510
    }
  };
}
