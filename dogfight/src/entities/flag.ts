import { Vec2d } from "../physics/vector";
import { Team } from "../constants";
import { Entity, EntityType } from "../entity";
import { Properties } from "../state";

export interface FlagOptions {
  id?: number;
  center?: Vec2d;
  team?: Team;
}

const example: FlagOptions = {
  id: -1,
  center: { x: 0, y: 0 },
  team: Team.Centrals
};

/**
 * A class that represents a ground object.
 *
 * A ground can be imagined as a flat plane.
 * It's center point is a (x,y) vector, and
 * it goes out in both directions by width length.
 */
export class FlagEntity implements Entity {
  public id: number = example.id;
  public readonly type = EntityType.Flag;

  /** (x, y) position of this object. */
  private center: Vec2d = example.center;

  /** The type of terrain this ground is */
  public team: Team = example.team;

  public constructor() {}

  public setOptions(opts: FlagOptions): void {
    for (const key in opts) {
      this[key] = opts[key];
    }
  }

  public getState(): Properties {
    return {
      x: this.center.x,
      y: this.center.y,
      team: this.team
    };
  }
}
