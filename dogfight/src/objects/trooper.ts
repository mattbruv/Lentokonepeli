import { Team, SCALE_FACTOR } from "../constants";
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

  public localX: number;
  public localY: number;
  public x: number;
  public y: number;
  public health: number;
  public state: TrooperState;
  public direction: TrooperDirection;
  public team: Team;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.localX = 0;
    this.localY = 0;
    this.setData(cache, {
      x: 0,
      y: 0,
      health: 255,
      state: TrooperState.Standing,
      direction: TrooperDirection.None,
      team: Team.Spectator
    });
  }

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public move(cache: Cache, deltaTime: number): void {
    const unitsPerSecond = 100 * SCALE_FACTOR;
    const multiplier = deltaTime / 1000;
    // const newX = this.x + Math.round(multiplier * unitsPerSecond);
    this.localX = this.localX + Math.round(multiplier * unitsPerSecond);
    this.set(cache, "x", Math.round(this.localX / SCALE_FACTOR));
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
