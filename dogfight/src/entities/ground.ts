import { Vec2d } from "../physics/vector";
import { Terrain } from "../constants";
import { Entity, EntityType } from "../entity";
import { Properties } from "../state";

export interface GroundOptions {
  id?: number;
  center?: Vec2d;
  width?: number;
  terrain?: Terrain;
}

const example: GroundOptions = {
  id: -1,
  center: { x: 0, y: 0 },
  width: 500,
  terrain: Terrain.Normal
};

/**
 * A class that represents a ground object.
 *
 * A ground can be imagined as a flat plane.
 * It's center point is a (x,y) vector, and
 * it goes out in both directions by width length.
 */
export class GroundEntity implements Entity {
  public id: number = example.id;
  public readonly type = EntityType.Ground;

  /** (x, y) position of this ground object. */
  private center: Vec2d = example.center;

  /**
   * The width of the ground.
   * Spans outward from the center both directions.
   *
   * For example, width = 500, center = (0, 0)
   * gives you a ground that is 500 wide,
   * centered on 0,0. (250 on each side)
   */
  private width: number = example.width;

  /** The type of terrain this ground is */
  private terrain: Terrain = example.terrain;

  public constructor() {}

  public setOptions(opts: GroundOptions): void {
    for (const key in opts) {
      this[key] = opts[key];
    }
  }

  public getState(): Properties {
    return {
      x: this.center.x,
      y: this.center.y,
      terrain: this.terrain,
      width: this.width
    };
  }

  public groundFunc(): void {
    console.log("Special ground function!");
  }
}
