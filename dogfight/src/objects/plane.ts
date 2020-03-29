import { GameObjectType, GameObject } from "../object";
import { Team, SCALE_FACTOR, ROTATION_DIRECTIONS } from "../constants";
import { Cache, CacheEntry } from "../network/cache";
import { directionToRadians } from "../physics/helpers";

export enum PlaneType {
  Albatros,
  Junkers,
  Fokker,
  Bristol,
  Salmson,
  Sopwith
}

interface TeamPlanes {
  [key: number]: PlaneType[];
}

export const teamPlanes: TeamPlanes = {
  [Team.Centrals]: [PlaneType.Albatros, PlaneType.Fokker, PlaneType.Junkers],
  [Team.Allies]: [PlaneType.Bristol, PlaneType.Sopwith, PlaneType.Salmson]
};

export class Plane extends GameObject {
  public type = GameObjectType.Plane;

  public localX: number;
  public localY: number;
  public x: number;
  public y: number;

  public team: Team;

  public planeType: PlaneType;
  public health: number;
  public direction: number;
  public flipped: boolean;

  public constructor(id: number, cache: Cache, kind: PlaneType, side: Team) {
    super(id);
    this.localX = 0;
    this.localY = 0;
    this.setData(cache, {
      x: 0,
      y: 0,
      flipped: false,
      direction: 0,
      health: 100,
      planeType: kind,
      team: side
    });
  }

  /*
    double d = getAngle(paramInt3);
    paramInt1 += (int)(100 * paramInt4 / 25.0D * Math.cos(d));
    paramInt2 += (int)(100 * paramInt4 / 25.0D * Math.sin(d));
  */
  public move(cache: Cache, deltaTime: number): void {
    const multiplier = deltaTime / 1000;
    const scaleSpeed = 250 * SCALE_FACTOR;
    const radians = directionToRadians(this.direction);
    const deltaX = Math.round(scaleSpeed * Math.cos(radians) * multiplier);
    const deltaY = Math.round(scaleSpeed * Math.sin(radians) * multiplier);
    this.localX += deltaX;
    this.localY += deltaY;
    this.setData(cache, {
      x: Math.round(this.localX / SCALE_FACTOR),
      y: Math.round(this.localY / SCALE_FACTOR)
    });
  }

  public rotate(cache: Cache): void {
    const direction = (this.direction + 1) % ROTATION_DIRECTIONS;
    this.setDirection(cache, direction);
  }

  public setDirection(cache: Cache, direction: number): void {
    this.set(cache, "direction", direction);
  }

  public setFlipped(cache: Cache, status: boolean): void {
    this.set(cache, "flipped", status);
  }

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      flipped: this.flipped,
      direction: this.direction,
      health: this.health,
      planeType: this.planeType,
      team: this.team
    };
  }
}
