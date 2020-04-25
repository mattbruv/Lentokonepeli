import { Team, SCALE_FACTOR } from "../constants";
import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";

export const trooperGlobals = {
  gravity: 425,
  dragFall: 0.005,
  dragChute: 0.1
}

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
  public vx: number;
  public vy: number;
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
      dx: 0,
      dy: 0,
      health: 255,
      state: TrooperState.Falling,
      direction: TrooperDirection.None,
      team: Team.Spectator
    });
  }

  public tick(cache: Cache, deltaTime: number): void {
    this.move(cache, deltaTime);
  }

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public move(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
    if (this.state == TrooperState.Falling || this.state == TrooperState.Parachuting) {
      const drag = this.state == TrooperState.Falling ? trooperGlobals.dragFall : trooperGlobals.dragChute;
      const dragForceX = drag * Math.pow(this.vx / SCALE_FACTOR, 2);
      const dragForceY = drag * Math.pow(this.vy / SCALE_FACTOR, 2);
      this.vx -= Math.sign(this.vx) * dragForceX;
      this.vy -= (Math.sign(this.vy) * dragForceY + trooperGlobals.gravity);
      this.localX += tstep * this.vx;
      this.localY += tstep * this.vy;
    } else if (this.state == TrooperState.Standing) {
      //      
    }

    //const unitsPerSecond = 100 * SCALE_FACTOR;
    //this.localX = this.localX + Math.round(tstep * unitsPerSecond);
    this.set(cache, "x", Math.round(this.localX / SCALE_FACTOR));
    this.set(cache, "y", Math.round(this.localY / SCALE_FACTOR));
  }

  public setVelocity(cache: Cache, vx: number, vy: number): void {
    this.set(cache, "vx", vx);
    this.set(cache, "vy", vy);
  }

  public setState(cache: Cache, state: TrooperState): void {
    this.setData(cache, {
      state: state,
    });
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
