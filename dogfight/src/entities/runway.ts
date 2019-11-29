import { Vec2d } from "../physics/vector";
import { RunwayDirection, Team } from "../constants";
import { Entity, EntityType } from "../entity";
import { Properties } from "../state";

export interface RunwayOptions {
  id?: number;
  center?: Vec2d;
  direction?: RunwayDirection;
  team?: Team;
  health?: number;
}

const example: RunwayOptions = {
  id: -1,
  center: { x: 0, y: 0 },
  direction: RunwayDirection.Right,
  team: Team.Centrals,
  health: 255
};

/**
 * A class that represents a ground object.
 *
 * A ground can be imagined as a flat plane.
 * It's center point is a (x,y) vector, and
 * it goes out in both directions by width length.
 */
export class RunwayEntity implements Entity {
  public id: number = example.id;
  public readonly type = EntityType.Runway;

  /** (x, y) position of this object. */
  private center: Vec2d = example.center;

  /** The type of terrain this ground is */
  public direction: RunwayDirection = example.direction;
  public team: Team = example.team;
  public health: number = example.health;

  public constructor() {}

  public setOptions(opts: RunwayOptions): void {
    for (const key in opts) {
      this[key] = opts[key];
    }
  }

  public getState(): Properties {
    return {
      x: this.center.x,
      y: this.center.y,
      direction: this.direction,
      team: this.team,
      health: this.health
    };
  }
}
