import { Terrain } from "../constants";
import { Entity, EntityType } from "../entity";
import { CacheEntry, Cache } from "../network/cache";
import { RectangleBody } from "../physics/rectangle";
import { GameWorld } from "../world/world";

export class Ground extends Entity {
  public type = EntityType.Ground;
  public x: number;
  public y: number;
  public width: number;
  public terrain: Terrain;

  public constructor(id: number, world: GameWorld, cache: Cache) {
    super(id, world);
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

export function getGroundRect(
  x: number,
  y: number,
  width: number
): RectangleBody {
  return {
    width: width,
    height: 40,
    center: {
      x,
      y: y - 25
    },
    direction: 0
  };
}
