import { FacingDirection } from "../constants";
import { Entity, EntityType } from "../entity";
import { Cache, CacheEntry } from "../network/cache";
import { RectangleBody, Rectangle } from "../physics/rectangle";
import { GameWorld } from "../world/world";
import { SolidEntity } from "./SolidEntity";

export class Water extends SolidEntity {
  public type = EntityType.Water;

  public x: number;
  public y: number;
  public width: number;
  public direction: FacingDirection;

  public constructor(id: number, world: GameWorld, cache: Cache) {
    super(id, world, -1);
    this.setData(cache, {
      x: 0,
      y: 0,
      width: 30000,
      direction: FacingDirection.Right
    });
  }

  public getCollisionBounds(): Rectangle {
    return new Rectangle(this.x, this.y + 5 - 50, this.width, 100);
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
