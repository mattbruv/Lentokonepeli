import { Team } from "../constants";
import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";

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

export class Trooper extends GameObject {
  public type = GameObjectType.Trooper;

  public x: number;
  public y: number;
  public health: number;
  public state: TrooperState;
  public direction: TrooperDirection;
  public team: Team;

  public constructor(id: number, cache: Cache) {
    super(id, cache);
    this.setData({
      x: 0,
      y: 0,
      health: 255,
      state: TrooperState.Standing,
      direction: TrooperDirection.None,
      team: Team.Spectator
    });
  }

  public move(deltaTime: number): void {
    const unitsPerSecond = 50;
    const multiplier = deltaTime / 1000;
    const newX = this.x + Math.round(multiplier * unitsPerSecond);
    this.set("x", newX);
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      health: this.health,
      state: this.state,
      direction: this.direction,
      team: this.team
    };
  }
}
