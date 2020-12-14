import { Terrain } from "../constants";
import { Entity, EntityType } from "../entity";
import { CacheEntry, Cache } from "../network/cache";
import { RectangleBody, Rectangle } from "../physics/rectangle";
import { GameWorld } from "../world/world";
import { SolidEntity } from "./SolidEntity";

export class Ground extends SolidEntity {
  public type = EntityType.Ground;
  public x: number;
  public y: number;
  public width: number;
  public terrain: Terrain;
  public image;
  private yHitOffset = 2; // 7

  public constructor(id: number, world: GameWorld, cache: Cache) {
    super(id, world, -1);
    this.image = world.getImage("ground1.gif");
    this.setData(cache, {
      x: 0,
      y: 0,
      width: 0,
      terrain: Terrain.Normal
    });
  }

  public getCollisionBounds(): import("../physics/rectangle").Rectangle {
    return new Rectangle(this.x, this.y - this.image.getHeight() / 2 - this.yHitOffset, this.width, this.image.getHeight());
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
