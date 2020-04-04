import { GameObjectType, GameObject } from "../object";
import { Team, SCALE_FACTOR, ROTATION_DIRECTIONS } from "../constants";
import { Cache, CacheEntry } from "../network/cache";
import { directionToRadians } from "../physics/helpers";
import { KeyChangeList, InputKey } from "../input";

export enum PlaneType {
  Albatros,
  Junkers,
  Fokker,
  Bristol,
  Salmson,
  Sopwith
}

export enum PlaneRotationStatus {
  None,
  Up,
  Down
}

interface TeamPlanes {
  [key: number]: PlaneType[];
}

interface PlaneInfo {
  [key: number]: {
    flightTime: number; // seconds flying
    ammo: number;
    fireRate: number; // shots per minute
    speed: number; // how fast the aircraft moves in units per second
    // flight altitude
    // resistance
  };
}

export const planeData: PlaneInfo = {
  [PlaneType.Albatros]: {
    flightTime: 80,
    ammo: 95,
    fireRate: 500,
    speed: 330
  },
  [PlaneType.Bristol]: {
    flightTime: 70,
    ammo: 100,
    fireRate: 600,
    speed: 281
  },
  [PlaneType.Fokker]: {
    flightTime: 90,
    ammo: 90,
    fireRate: 454,
    speed: 292
  },
  [PlaneType.Junkers]: {
    flightTime: 100,
    ammo: 100,
    fireRate: 18,
    speed: 271
  },
  [PlaneType.Salmson]: {
    flightTime: 60,
    ammo: 60,
    fireRate: 316,
    speed: 317
  },
  [PlaneType.Sopwith]: {
    flightTime: 80,
    ammo: 80,
    fireRate: 432,
    speed: 330
  }
};

export const teamPlanes: TeamPlanes = {
  [Team.Centrals]: [PlaneType.Albatros, PlaneType.Fokker, PlaneType.Junkers],
  [Team.Allies]: [PlaneType.Bristol, PlaneType.Sopwith, PlaneType.Salmson]
};

const bomberPlanes: PlaneType[] = [PlaneType.Junkers, PlaneType.Salmson];

export class Plane extends GameObject {
  public type = GameObjectType.Plane;

  public x: number;
  public y: number;

  public team: Team;

  public planeType: PlaneType;
  public direction: number;
  public flipped: boolean;
  public health: number;
  public fuel: number;
  public ammo: number;
  public bombs: number;

  // internal variables //

  private rotateStatus: PlaneRotationStatus;

  // physics variables
  public localX: number;
  public localY: number;
  private speed: number;

  // number of elapsed milliseconds since last fuel decrease.
  private fuelCounter: number;
  // number of milliseconds elapsed to decrease fuel by 1.
  private fuelThreshold: number;

  public constructor(id: number, cache: Cache, kind: PlaneType, side: Team) {
    super(id);
    // set internal variables
    this.localX = 0;
    this.localY = 0;
    this.rotateStatus = PlaneRotationStatus.None;

    // set fuel decrement threshold
    this.fuelCounter = 0;
    this.fuelThreshold = Math.round(1000 / (255 / planeData[kind].flightTime));
    this.speed = planeData[kind].speed;

    // set networked variables
    this.setData(cache, {
      x: 0,
      y: 0,
      flipped: false,
      direction: 0,
      planeType: kind,
      team: side,
      health: 255,
      fuel: 255,
      ammo: 255,
      bombs: 0
    });
    if (bomberPlanes.includes(this.planeType)) {
      this.set(cache, "bombs", 5);
    }
  }

  // advance the plane simulation
  public tick(cache: Cache, deltaTime: number): void {
    this.rotate(cache);
    this.move(cache, deltaTime);
    this.burnFuel(cache, deltaTime);
  }

  private burnFuel(cache: Cache, deltaTime: number): void {
    // add time to counter
    this.fuelCounter += deltaTime;

    // if time elapsed is greater than our threshold,
    // it's time to burn some fuel.
    if (this.fuelCounter > this.fuelThreshold) {
      // burn fuel
      const unitsToBurn = Math.floor(this.fuelCounter / this.fuelThreshold);
      let newFuel = this.fuel - unitsToBurn;
      if (newFuel < 0) {
        newFuel = 0;
      }
      this.fuelCounter = this.fuelCounter % this.fuelThreshold;
      this.set(cache, "fuel", newFuel);
    }
  }

  private move(cache: Cache, deltaTime: number): void {
    const multiplier = deltaTime / 1000;
    const scaleSpeed = this.speed * SCALE_FACTOR;
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

  public setRotation(cache: Cache, key: InputKey, doRotate: boolean): void {
    if (doRotate == false) {
      this.rotateStatus = PlaneRotationStatus.None;
      return;
    }
    if (key == InputKey.Left) {
      this.rotateStatus = PlaneRotationStatus.Up;
    } else {
      this.rotateStatus = PlaneRotationStatus.Down;
    }
  }

  public rotate(cache: Cache): void {
    if (this.rotateStatus == PlaneRotationStatus.None) {
      return;
    }
    const offset = this.rotateStatus == PlaneRotationStatus.Up ? 1 : -1;
    const rotateSpeed = 2;
    const direction =
      (this.direction + offset * rotateSpeed) % ROTATION_DIRECTIONS;
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
      team: this.team,
      fuel: this.fuel,
      ammo: this.ammo,
      bombs: this.bombs
    };
  }
}
