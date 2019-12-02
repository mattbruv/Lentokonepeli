import { Vec2d } from "../physics/vector";
import { Team } from "../constants";
import { Entity, EntityType } from "../entity";
import { Properties } from "../state";

export enum TrooperState {
  Parachuting,
  Falling,
  Standing,
  Walking
}

export enum TrooperDirection {
  None,
  Left,
  Right
}

export interface TrooperOptions {
  id?: number;
  position?: Vec2d;
  team?: Team;
  health?: number;
  state?: TrooperState;
  direction?: TrooperDirection;
}

const example: TrooperOptions = {
  id: -1,
  position: { x: 0, y: 0 },
  team: Team.Centrals,
  health: 1,
  state: TrooperState.Parachuting,
  direction: TrooperDirection.None
};

export class TrooperEntity implements Entity {
  public id: number = example.id;
  public readonly type = EntityType.Trooper;

  /** (x, y) position of this object. */
  private position: Vec2d = example.position;

  public team: Team = example.team;
  public health: number = example.health;
  public state: TrooperState = example.state;
  public direction: TrooperDirection = example.direction;

  public constructor() {}

  public setOptions(opts: TrooperOptions): void {
    for (const key in opts) {
      this[key] = opts[key];
    }
  }

  public getState(): Properties {
    return {
      x: this.position.x,
      y: this.position.y,
      team: this.team,
      health: this.health,
      state: this.state,
      direction: this.direction
    };
  }
}
