import { Vec2d } from "../physics/vector";
import { WaveDirection } from "../constants";
import { Entity, EntityType } from "../entity";
import { Properties } from "../state";

export interface WaterOptions {
  id?: number;
  center?: Vec2d;
  width?: number;
  direction?: WaveDirection;
}

const example: WaterOptions = {
  id: -1,
  center: { x: 0, y: 0 },
  width: 100,
  direction: WaveDirection.Right
};

/**
 * A class that represents a ground object.
 *
 * A ground can be imagined as a flat plane.
 * It's center point is a (x,y) vector, and
 * it goes out in both directions by width length.
 */
export class WaterEntity implements Entity {
  public id: number = example.id;
  public readonly type = EntityType.Water;

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
  private direction: WaveDirection = example.direction;

  public constructor() {}

  public setOptions(opts: WaterOptions): void {
    for (const key in opts) {
      this[key] = opts[key];
    }
  }

  public getState(): Properties {
    return {
      x: this.center.x,
      y: this.center.y,
      direction: this.direction,
      width: this.width
    };
  }
}
