import { GameObjectType, GameObject } from "../object";
import { Team, SCALE_FACTOR, ROTATION_DIRECTIONS } from "../constants";
import { Cache, CacheEntry } from "../network/cache";
import { directionToRadians, mod } from "../physics/helpers";
import { InputKey } from "../input";

// Movement Physics
const w0 = 128;
const gravity = 300;// * SCALE_FACTOR;

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
  private px: number;
  private py: number;
  private vx: number;
  private vy: number;
  private ax: number;
  private ay: number;
  private turnDirection: number;
  private fc: number;
  private speed: number;
  private drag: number;
  private thrust: number;
  private maxSpeed: number;
  public minSpeed: number;
  private turnRadius: number;
  private maxAltitude: number;

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
    // These 5 variables can be tweaked for diff planes.
    this.thrust = 250;// * SCALE_FACTOR;  // engine acceleration
    this.maxSpeed = 350;// * SCALE_FACTOR; // maximum horizontal speed
    this.minSpeed = 150;// * SCALE_FACTOR; // minimum speed to not stall
    this.turnRadius = 150;// * SCALE_FACTOR; // turning radius
    this.maxAltitude = 1000; //Force stall above this height
    // set internal variables
    this.px = 2096; // x position
    this.py = 500; // y position
    this.vx = -200; // x velocity
    this.vy = 0; // y velocity
    this.ax = 0; // x acceleration
    this.ay = 0; // y acceleration
    this.direction = 0; // forward angle
    this.turnDirection = 0; // angle towards turn
    this.fc = 0; // centripetal force
    this.speed = Math.pow(Math.pow(this.vx, 2) + Math.pow(this.vy, 2), 0.5); // speed
    this.drag = this.thrust / Math.pow(this.maxSpeed, 2); // drag coefficient
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
    //const speed = planeData[kind].speed;
    //this.d = Math.round(thrust / SCALE_FACTOR) / speed;

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
    if (this.fuel <= 0) {
      this.setEngine(cache, false);
      return;
    }
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

  private ballistic(): void {
    this.ax = -this.drag * Math.pow(this.speed, 2) * Math.cos((Math.PI * this.direction) / w0);
    this.ay = -gravity - this.drag * Math.pow(this.speed, 2) * Math.sin((Math.PI * this.direction) / w0);
  }

  private flight(): void {
    const engine = this.engineOn == true ? 1 : 0;
    const flipped = this.flipped == true ? 1 : 1;
    if (this.rotateStatus == PlaneRotationStatus.Up) {
      this.turnDirection = this.direction + flipped * w0 / 2;
      this.fc = Math.pow(this.speed, 2) / this.turnRadius;
    } else if (this.rotateStatus == PlaneRotationStatus.Down) {
      this.turnDirection = this.direction - flipped * w0 / 2;
      this.fc = Math.pow(this.speed, 2) / this.turnRadius;
    } else {
      this.fc = 0;
    }
    const dv = (engine * this.thrust - this.drag * Math.pow(this.speed, 2) - gravity * Math.sin(Math.PI * this.direction / w0));
    this.ax = (dv * Math.cos(Math.PI * this.direction / w0) + this.fc * Math.cos(Math.PI * this.turnDirection / w0));
    this.ay = (dv * Math.sin(Math.PI * this.direction / w0) + this.fc * Math.sin(Math.PI * this.turnDirection / w0));
  }

  private move(cache: Cache, deltaTime: number): void {
    //console.log("speed:", this.speed, 'fc:', this.fc, "angle:", this.direction, "turn angle:", this.turnDirection);
    //console.log('px:', this.px, 'py:', this.py, 'vx:', this.vx, 'vy:', this.vy, 'ax:', this.ax, 'ay:', this.ay);
    console.log('speed:', Math.round(this.speed), 'px:', Math.round(this.px), 'py:', Math.round(this.py));
    const tstep = deltaTime / 1000; // deltatime = milliseconds between frames

    this.speed = Math.pow(Math.pow(this.vx, 2) + Math.pow(this.vy, 2), 0.5);
    if (this.speed < this.minSpeed || this.py > this.maxAltitude) { // || (!this.engineOn && this.rotateStatus == PlaneRotationStatus.None)) {
      this.ballistic();
    } else {
      this.flight();
    }
    this.vx += this.ax * tstep;
    this.vy += this.ay * tstep;
    this.px += this.vx * tstep;
    this.py += this.vy * tstep;

    this.direction = Math.round(w0 * Math.atan2(this.vy, this.vx) / Math.PI);
    this.setData(cache, {
      x: Math.round(this.px),//   /SCALE_FACTOR),
      y: Math.round(this.py)//   /SCALE_FACTOR)
    });
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
    //if (this.rotateStatus == PlaneRotationStatus.None) {
    //  return;
    //}
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
    //this.setDirection(cache, direction);
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
    this.px = x;// * SCALE_FACTOR;
    this.py = y;// * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public setVel(cache: Cache, vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
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
