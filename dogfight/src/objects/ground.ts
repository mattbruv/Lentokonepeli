import { Terrain } from "../constants";
import { GameObject, GameObjectType } from "../object";
import { CacheEntry, Cache } from "../network/cache";
import { RectangleBody } from "../physics/rectangle";

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

  public getRect(): RectangleBody {
    return {
      width: this.width,
      height: 20,
      center: {
        x: this.x,
        y: this.y - 20
      },
      direction: 0
    };
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
