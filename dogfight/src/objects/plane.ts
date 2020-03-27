import { GameObjectType, GameObject } from "../object";
import { Team, SCALE_FACTOR } from "../constants";
import { Cache, CacheEntry } from "../network/cache";

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

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public move(cache: Cache, deltaTime: number): void {
    const unitsPerSecond = 100 * SCALE_FACTOR;
    const multiplier = deltaTime / 1000;
    this.localX = this.localX + Math.round(multiplier * unitsPerSecond);
    this.set(cache, "x", Math.round(this.localX / SCALE_FACTOR));
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      flipped: this.flipped,
      direction: this.direction,
      health: this.health,
      planeType: this.planeType
    };
  }
}
