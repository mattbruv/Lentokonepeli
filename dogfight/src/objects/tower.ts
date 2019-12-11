import { Vec2d } from "../physics/vector";
import { Team, ControlTowerDirection, Terrain } from "../constants";
import { Entity, EntityType } from "../entity";
import { Properties } from "../state";

export interface ControlTowerOptions {
  id?: number;
  center?: Vec2d;
  terrain?: Terrain;
  direction?: ControlTowerDirection;
}

const example: ControlTowerOptions = {
  id: -1,
  center: { x: 0, y: 0 },
  terrain: Terrain.Normal,
  direction: ControlTowerDirection.Right
};

/**
 * A class that represents a ground object.
 *
 * A ground can be imagined as a flat plane.
 * It's center point is a (x,y) vector, and
 * it goes out in both directions by width length.
 */
export class ControlTowerEntity implements Entity {
  public id: number = example.id;
  public readonly type = EntityType.ControlTower;

  /** (x, y) position of this object. */
  private center: Vec2d = example.center;

  /** The type of terrain this ground is */
  public terrain: Terrain = example.terrain;

  private direction: ControlTowerDirection = example.direction;

  public constructor() {}

  public setOptions(opts: ControlTowerOptions): void {
    for (const key in opts) {
      this[key] = opts[key];
    }
  }

  public getState(): Properties {
    return {
      x: this.center.x,
      y: this.center.y,
      terrain: this.terrain,
      direction: this.direction
    };
  }
}
