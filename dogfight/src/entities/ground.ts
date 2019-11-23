import { Vec2d } from "../physics/vector";
import { Terrain } from "../constants";
import { Entity, EntityProperty } from "../entity";

export interface GroundOptions {
  center?: Vec2d;
  width?: number;
  terrain?: Terrain;
}

const example: GroundOptions = {
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
  public id;

  /** (x, y) position of this ground object. */
  private center: Vec2d;

  /**
   * The width of the ground.
   * Spans outward from the center both directions.
   *
   * For example, width = 500, center = (0, 0)
   * gives you a ground that is 500 wide,
   * centered on 0,0. (250 on each side)
   */
  private width: number;

  /** The type of terrain this ground is */
  private terrain: Terrain;

  public constructor(opts: GroundOptions) {
    this.center = opts.center != null ? opts.center : example.center;
    this.width = opts.width != null ? opts.width : example.width;
    this.terrain = opts.terrain != null ? opts.terrain : example.terrain;
  }

  public getState(): EntityProperty[] {
    return [];
  }

  public groundFunc(): void {
    console.log("Special ground function!");
  }
}
