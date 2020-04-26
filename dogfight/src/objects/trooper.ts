import { Team, SCALE_FACTOR } from "../constants";
import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";
import { InputKey } from "../input";
import { RectangleBody } from "../physics/rectangle";

export const trooperGlobals = {
  gravity: 500,
  dragFall: 0.001,
  dragChute: 0.1,
  walkSpeed: 100,
  crashSurviveSpeed: 100,
  fireRate: 119,
  targetRadius: 300
};

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
  public ammo: number;

  public isShooting: boolean;
  public lastShot: number;
  public shotThreshold: number;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.localX = 0;
    this.localY = 0;
    this.isShooting = false;
    this.shotThreshold = Math.round(1000 / (trooperGlobals.fireRate / 60));
    this.lastShot = this.shotThreshold;
    this.setData(cache, {
      x: 0,
      y: 0,
      ammo: 255,
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
    /*
    console.log(
      "trooperstate:",
      this.state,
      "trooperDirection:",
      this.direction
    );
    */
    const tstep = deltaTime / 1000;
    if (this.state == TrooperState.Falling) {
      const drag = trooperGlobals.dragFall;
      const dragForceY = drag * Math.pow(this.vy / SCALE_FACTOR, 2);
      this.vy -= Math.sign(this.vy) * dragForceY + trooperGlobals.gravity;
      this.localY += tstep * this.vy;
    } else if (this.state == TrooperState.Parachuting) {
      const drag = trooperGlobals.dragChute;
      const dragForceY = drag * Math.pow(this.vy / SCALE_FACTOR, 2);
      this.vy -= Math.sign(this.vy) * dragForceY + trooperGlobals.gravity;
      const speed = trooperGlobals.walkSpeed * SCALE_FACTOR;
      if (this.direction == TrooperDirection.Left) {
        this.vx = -speed;
      } else if (this.direction == TrooperDirection.Right) {
        this.vx = speed;
      } else {
        this.vx = 0;
      }
      this.localX += tstep * this.vx;
      this.localY += tstep * this.vy;
    } else if (this.state == TrooperState.Standing) {
      if (this.direction != TrooperDirection.None) {
        this.setState(cache, TrooperState.Walking);
      }
    } else if (this.state == TrooperState.Walking) {
      const speed = trooperGlobals.walkSpeed * SCALE_FACTOR;
      if (this.direction == TrooperDirection.Left) {
        this.localX -= tstep * speed;
      } else if (this.direction == TrooperDirection.Right) {
        this.localX += tstep * speed;
      } else {
        this.setState(cache, TrooperState.Standing);
      }
    }

    //const unitsPerSecond = 100 * SCALE_FACTOR;
    //this.localX = this.localX + Math.round(tstep * unitsPerSecond);
    this.set(cache, "x", Math.round(this.localX / SCALE_FACTOR));
    this.set(cache, "y", Math.round(this.localY / SCALE_FACTOR));
  }

  public setVelocity(cache: Cache, vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
  }

  public setState(cache: Cache, state: TrooperState): void {
    this.setData(cache, {
      state: state
    });
  }

  public setDirection(cache: Cache, key: InputKey, doWalk: boolean): void {
    if (doWalk == false) {
      this.direction = TrooperDirection.None;
      return;
    }
    if (key == InputKey.Left) {
      this.direction = TrooperDirection.Left;
    } else {
      this.direction = TrooperDirection.Right;
    }
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      health: this.health,
      state: this.state,
      direction: this.direction,
      ammo: this.ammo,
      team: this.team
    };
  }
}

export function getTrooperRect(x: number, y: number): RectangleBody {
  return {
    // width: Math.round(planeData[type].width * 0.8),
    // height: Math.round(planeData[type].height * 0.8),
    width: 1,
    height: 1,
    center: { x, y },
    direction: 0
  };
}
