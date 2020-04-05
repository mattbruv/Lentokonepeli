import { GameObjectType, GameObject } from "../object";
import { Team, SCALE_FACTOR, ROTATION_DIRECTIONS } from "../constants";
import { Cache, CacheEntry } from "../network/cache";
import { directionToRadians, mod } from "../physics/helpers";
import { InputKey } from "../input";

// Movement Physics
const thrust = 500 * SCALE_FACTOR;
// const drag = 1.5; //  * SCALE_FACTOR; //0 * SCALE_FACTOR;
// theta
// pos = localX, localY
//const stallV = 1 * SCALE_FACTOR;
//const maxVelocity = 10 * SCALE_FACTOR;
//const stallTurnRate = 1 * SCALE_FACTOR;
const gravity = 500 * SCALE_FACTOR;
//const turnRate = Math.round(0.1 * SCALE_FACTOR);

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
    turnRate: number; // degrees turned per second.
    // flight altitude
    // resistance
  };
}

export const planeData: PlaneInfo = {
  [PlaneType.Albatros]: {
    flightTime: 80,
    ammo: 95,
    fireRate: 500,
    speed: 330,
    turnRate: 150
  },
  [PlaneType.Bristol]: {
    flightTime: 70,
    ammo: 100,
    fireRate: 600,
    speed: 281,
    turnRate: 110
  },
  [PlaneType.Fokker]: {
    flightTime: 90,
    ammo: 90,
    fireRate: 454,
    speed: 292,
    turnRate: 190
  },
  [PlaneType.Junkers]: {
    flightTime: 100,
    ammo: 100,
    fireRate: 18,
    speed: 271,
    turnRate: 90
  },
  [PlaneType.Salmson]: {
    flightTime: 60,
    ammo: 60,
    fireRate: 316,
    speed: 317,
    turnRate: 128
  },
  [PlaneType.Sopwith]: {
    flightTime: 80,
    ammo: 80,
    fireRate: 432,
    speed: 330,
    turnRate: 190
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
  public engineOn: boolean;

  // internal variables //

  private rotateStatus: PlaneRotationStatus;

  // physics variables
  private localX: number;
  private localY: number;
  private velocity = 0; //3 * SCALE_FACTOR;
  private drag: number;

  // number of elapsed milliseconds since last fuel decrease.
  private fuelCounter: number;
  // number of milliseconds elapsed to decrease fuel by 1.
  private fuelThreshold: number;

  // number of elapsed ms since last rotation change
  private rotationCounter: number;
  // number of degrees to turn per second.
  private rotationThreshold: number;

  public constructor(id: number, cache: Cache, kind: PlaneType, side: Team) {
    super(id);
    // set internal variables
    this.localX = 0;
    this.localY = 0;
    this.rotateStatus = PlaneRotationStatus.None;

    // set fuel decrement threshold
    this.fuelCounter = 0;
    this.fuelThreshold = Math.round(1000 / (255 / planeData[kind].flightTime));

    // rotation variables
    this.rotationCounter = 0;
    // degrees per second.
    this.rotationThreshold = Math.round(1000 / planeData[kind].turnRate);

    // physics variables
    // Max speed is set via drag value.
    // figured out relative to other forces.
    const speed = planeData[kind].speed;
    this.drag = Math.round(thrust / SCALE_FACTOR) / speed;

    console.log(PlaneType[kind], speed, "drag:", this.drag);

    // set networked variables
    this.setData(cache, {
      x: 0,
      y: 0,
      flipped: false,
      engineOn: true,
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
    this.rotate(cache, deltaTime);
    this.move(cache, deltaTime);
    this.burnFuel(cache, deltaTime);
  }

  private burnFuel(cache: Cache, deltaTime: number): void {
    // Don't burn fuel if engine is off.
    if (!this.engineOn) {
      return;
    }

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

  private accelerate(y: number, engineStatus: boolean, v: number): number {
    // Also, in the acceleration function you can experiment with drag*v^2,
    // that's more realistic but will come down to how it feels
    const engine = engineStatus == true ? 1 : 0;
    return -y * gravity - this.drag * v + engine * thrust;
    // return -y * gravity - drag * Math.pow(v, 2) + engine * thrust;
  }

  private move(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000; // deltatime = milliseconds between frames
    const radians = directionToRadians(this.direction);
    // const cosTheta = Math.cos(this.direction);
    const sinTheta = Math.sin(radians);

    // y = sin(theta)
    const accel = this.accelerate(sinTheta, this.engineOn, this.velocity);
    this.velocity = this.velocity + accel * tstep;

    //console.log(this.velocity);
    const deltaX = Math.round(this.velocity * Math.cos(radians) * tstep);
    const deltaY = Math.round(this.velocity * Math.sin(radians) * tstep);
    this.localX += deltaX;
    this.localY += deltaY;
    this.setData(cache, {
      x: Math.round(this.localX / SCALE_FACTOR),
      y: Math.round(this.localY / SCALE_FACTOR)
    });
    /*
  const multiplier = deltaTime / 1000;
  const v = this.speed * SCALE_FACTOR;
  const radians = directionToRadians(this.direction);
  const deltaX = Math.round(scaleSpeed * Math.cos(radians) * multiplier);
  const deltaY = Math.round(scaleSpeed * Math.sin(radians) * multiplier);
  this.localX += deltaX;
  this.localY += deltaY;
  */
  }

  public setRotation(cache: Cache, key: InputKey, doRotate: boolean): void {
    this.rotationCounter = 0;
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

  public rotate(cache: Cache, deltaTime: number): void {
    if (this.rotateStatus == PlaneRotationStatus.None) {
      return;
    }
    const upOrDown = this.rotateStatus == PlaneRotationStatus.Up ? 1 : -1;
    // add time to counter
    this.rotationCounter += deltaTime;

    // if time elapsed is greater than our threshold,
    // it's time to rotate
    if (this.rotationCounter > this.rotationThreshold) {
      // rotate plane
      const degreesToRotate = Math.floor(
        this.rotationCounter / this.rotationThreshold
      );
      let newDirection = this.direction + degreesToRotate * upOrDown;
      newDirection = mod(newDirection, ROTATION_DIRECTIONS);
      this.rotationCounter = this.rotationCounter % this.rotationThreshold;
      this.set(cache, "direction", newDirection);
    }
    //   (this.direction + offset * rotateSpeed) % ROTATION_DIRECTIONS;
    // this.setDirection(cache, direction);
  }

  public setDirection(cache: Cache, direction: number): void {
    this.set(cache, "direction", direction);
  }

  public setFlipped(cache: Cache, status: boolean): void {
    this.set(cache, "flipped", status);
  }

  public setEngine(cache: Cache, status: boolean): void {
    this.set(cache, "engineOn", status);
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
