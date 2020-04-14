import { GameObjectType, GameObject } from "../object";
import {
  Team,
  SCALE_FACTOR,
  ROTATION_DIRECTIONS,
  BuildType
} from "../constants";
import { Cache, CacheEntry } from "../network/cache";
import { mod, magnitude, getAngle, getInclination } from "../physics/helpers";
import { InputKey } from "../input";
import { RectangleBody } from "../physics/rectangle";

// Movement Physics
export const planeGlobals = {
  w0: Math.round(ROTATION_DIRECTIONS / 2),
  gravity: 425
};

export const infoHUD = {
  speed: 0,
  altitude: 0,
  angle: 0,
  maxAscentAngle: 0
};

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
    width: number; // Plane width for collision
    height: number; // Plane height for collision
    flightTime: number; // seconds flying
    ammo: number;
    fireRate: number; // shots per minute
    thrust: number; // engine acceleration
    maxSpeed: number; // maximum horizontal speed
    minSpeed: number; // minimum speed to not stall
    turnRadius: number; // turning radius
    maxAltitude: number; //Force stall above this height
    recoveryAngle: number; // Angle at which the plane recovers from stalling
    glideAngle: number; // angle below horizontal at which you regain control when gliding with engine off
    freeDrag: number; // Drag multiplier with engine off
  };
}

export const planeData: PlaneInfo = {
  [PlaneType.Albatros]: {
    width: 30,
    height: 16,
    flightTime: 80,
    ammo: 95,
    fireRate: 500,
    thrust: 290,
    maxSpeed: 330,
    minSpeed: 125,
    turnRadius: 130,
    maxAltitude: 660,
    recoveryAngle: 20,
    glideAngle: 64,
    freeDrag: 1.2
  },
  [PlaneType.Bristol]: {
    width: 36,
    height: 19,
    flightTime: 70,
    ammo: 100,
    fireRate: 600,
    thrust: 310,
    maxSpeed: 281,
    minSpeed: 100,
    turnRadius: 122,
    maxAltitude: 610,
    recoveryAngle: 25,
    glideAngle: 64,
    freeDrag: 1
  },
  [PlaneType.Fokker]: {
    width: 38,
    height: 20,
    flightTime: 90,
    ammo: 90,
    fireRate: 454,
    thrust: 330,
    maxSpeed: 292,
    minSpeed: 105,
    turnRadius: 75,
    maxAltitude: 600,
    recoveryAngle: 20,
    glideAngle: 64,
    freeDrag: 1.2
  },
  [PlaneType.Junkers]: {
    width: 42,
    height: 19,
    flightTime: 100,
    ammo: 100,
    fireRate: 180,
    thrust: 300,
    maxSpeed: 271,
    minSpeed: 100,
    turnRadius: 150,
    maxAltitude: 580,
    recoveryAngle: 20,
    glideAngle: 64,
    freeDrag: 1.2
  },
  [PlaneType.Salmson]: {
    width: 40,
    height: 15,
    flightTime: 60,
    ammo: 60,
    fireRate: 316,
    thrust: 350,
    maxSpeed: 317,
    minSpeed: 110,
    turnRadius: 140,
    maxAltitude: 680,
    recoveryAngle: 20,
    glideAngle: 64,
    freeDrag: 1.2
  },
  [PlaneType.Sopwith]: {
    width: 37,
    height: 20,
    flightTime: 80,
    ammo: 80,
    fireRate: 432,
    thrust: 330,
    maxSpeed: 330,
    minSpeed: 115,
    turnRadius: 75,
    maxAltitude: 590,
    recoveryAngle: 20,
    glideAngle: 64,
    freeDrag: 1.3
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

  // plane stats
  private drag: number; // How well the plane's momentum is carried
  private freeDrag: number; // Drag multiplier with engine off
  private thrust: number; // Acelleration of the engine
  private maxSpeed: number; // Top engine speed of the plane
  public minSpeed: number; // Stall velocity. Below this stalls the plane.
  private turnRadius: number; // How wide a plane turns.
  private maxAltitude: number; // How high the plane can fly
  private recoveryAngle: number; // The angle above horizontal at which you regain control during a stall
  private glideAngle: number; // angle below horizontal at which you regain control when gliding with engine off

  // internal variables //
  private rotateStatus: PlaneRotationStatus;

  // physics variables
  private px: number; // local scaled X position
  private py: number; // local scaled Y position
  private vx: number; // velocity in X direction
  private vy: number; // velocity in Y direction
  private ax: number; // acceleration in X direction
  private ay: number; // acceleration in Y direction
  private turnDirection: number; // 90 degree angle relative to our current direction and turn path
  private fc: number; // Centripetal force
  private speed: number; // Current speed of the plane

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
    this.thrust = planeData[kind].thrust * SCALE_FACTOR; // engine acceleration
    this.maxSpeed = planeData[kind].maxSpeed * SCALE_FACTOR; // maximum horizontal speed
    this.minSpeed = planeData[kind].minSpeed * SCALE_FACTOR; // minimum speed to not stall
    this.turnRadius = planeData[kind].turnRadius * SCALE_FACTOR; // turning radius
    this.maxAltitude = planeData[kind].maxAltitude * SCALE_FACTOR; //Force stall above this height
    this.recoveryAngle = planeData[kind].recoveryAngle;
    this.glideAngle = planeData[kind].glideAngle;
    this.freeDrag = planeData[kind].freeDrag; // Drag multiplier with engine off

    // set internal variables
    this.px = 0; // x position
    this.py = 0; // y position
    this.vx = 0; // x velocity
    this.vy = 0; // y velocity
    this.ax = 0; // x acceleration
    this.ay = 0; // y acceleration
    this.direction = 0; // forward angle
    this.turnDirection = 0; // angle towards turn
    this.fc = 0; // centripetal force
    this.speed = magnitude(this.vx, this.vy); // speed
    this.drag = this.thrust / Math.pow(this.maxSpeed, 2); // drag coefficient
    this.rotateStatus = PlaneRotationStatus.None;

    // set fuel decrement threshold
    this.fuelCounter = 0;
    this.fuelThreshold = Math.round(1000 / (255 / planeData[kind].flightTime));

    // rotation variables
    this.rotationCounter = 0;
    // degrees per second.
    this.rotationThreshold = planeGlobals.w0 / 10;

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
    if (process.env.BUILD == BuildType.Client) {
      this.updateVars(this.planeType);
    }
    //this.rotate(cache, deltaTime);
    this.move(cache, deltaTime);
    this.burnFuel(cache, deltaTime);
  }

  public updateVars(kind: PlaneType): void {
    this.recoveryAngle = planeData[kind].recoveryAngle;
    this.glideAngle = planeData[kind].glideAngle;
    this.thrust = planeData[kind].thrust * SCALE_FACTOR; // engine acceleration
    this.maxSpeed = planeData[kind].maxSpeed * SCALE_FACTOR; // maximum horizontal speed
    this.minSpeed = planeData[kind].minSpeed * SCALE_FACTOR; // minimum speed to not stall
    this.turnRadius = planeData[kind].turnRadius * SCALE_FACTOR; // turning radius
    this.maxAltitude = planeData[kind].maxAltitude * SCALE_FACTOR; //Force stall above this height
    this.drag = this.thrust / Math.pow(this.maxSpeed, 2); // drag coefficient
    this.freeDrag = planeData[kind].freeDrag; // Drag multiplier with engine off

    infoHUD.maxAscentAngle =
      (Math.asin(
        (this.thrust - this.drag * Math.pow(this.minSpeed, 2)) /
        (planeGlobals.gravity * SCALE_FACTOR)
      ) *
        planeGlobals.w0) /
      Math.PI;
    const a = infoHUD.maxAscentAngle;
    infoHUD.maxAscentAngle = Math.round(a * 10) / 10;
    infoHUD.angle = this.direction;
    infoHUD.altitude = this.y;
    infoHUD.speed = Math.round(this.speed / SCALE_FACTOR);
  }

  private move(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000; // deltatime = milliseconds between frames
    const w0 = planeGlobals.w0;

    // Pythagorean theorem
    this.speed = magnitude(this.vx, this.vy);

    const recoveryAngle =
      this.engineOn == true ? this.recoveryAngle : -this.glideAngle;
    const aboveRecoveryAngle = getInclination(this.direction) > recoveryAngle;
    const tooHigh = this.py > this.maxAltitude;
    const tooSlow = this.speed < this.minSpeed;
    const ifStalling = (tooSlow && aboveRecoveryAngle) || tooHigh;

    if (ifStalling) {
      this.moveBallistic();
    } else {
      this.moveFlight();
    }

    // update velocity
    this.vx += this.ax * tstep;
    this.vy += this.ay * tstep;
    // update local position
    this.px += this.vx * tstep;
    this.py += this.vy * tstep;

    this.setDirection(cache, getAngle(this.vx, this.vy));
    this.setData(cache, {
      x: Math.round(this.px / SCALE_FACTOR),
      y: Math.round(this.py / SCALE_FACTOR)
    });
  }

  private moveBallistic(): void {
    const angle = (Math.PI * this.direction) / planeGlobals.w0;
    const feather = 0.9; // must be in this range:(0 <= feather < 1) set to 0 for old behaviour
    //const gravityFeather = (1 - feather * Math.pow(100, -Math.pow(this.speed / this.minSpeed, 2))); //smoother but more intensive
    const gravityFeather = (1 - feather) + feather * Math.abs(this.speed / this.minSpeed); //much less intensive
    const gravity = planeGlobals.gravity * SCALE_FACTOR * gravityFeather;
    const dragForce = this.drag * this.freeDrag * Math.pow(this.speed, 2);
    this.ax = -dragForce * Math.cos(angle);
    this.ay = -gravity - dragForce * Math.sin(angle);
  }

  private moveFlight(): void {
    const engine = this.engineOn == true ? 1 : 0;
    const w0 = planeGlobals.w0;
    const drag = this.drag * (this.freeDrag + engine * (1 - this.freeDrag));

    // Calculate the turn angle based on which direction we're trying to turn.
    // And calculate centripetal force
    if (this.rotateStatus == PlaneRotationStatus.Up) {
      this.turnDirection = this.direction + w0 / 2;
      this.fc = Math.pow(this.speed, 2) / this.turnRadius;
    } else if (this.rotateStatus == PlaneRotationStatus.Down) {
      this.turnDirection = this.direction - w0 / 2;
      this.fc = Math.pow(this.speed, 2) / this.turnRadius;
    } else {
      this.fc = 0;
    }

    // Acceleration in forward direction
    const angle = (Math.PI * this.direction) / planeGlobals.w0;
    const turnAngle = (Math.PI * this.turnDirection) / planeGlobals.w0;
    const gravityForce = planeGlobals.gravity * SCALE_FACTOR * Math.sin(angle);
    const dragForce = drag * Math.pow(this.speed, 2);
    const engineForce = engine * this.thrust;
    const dv = engineForce - dragForce - gravityForce;
    this.ax = dv * Math.cos(angle) + this.fc * Math.cos(turnAngle);
    this.ay = dv * Math.sin(angle) + this.fc * Math.sin(turnAngle);
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
    const upOrDown =
      this.rotateStatus == PlaneRotationStatus.None
        ? 0
        : this.rotateStatus == PlaneRotationStatus.Up
          ? 1
          : -1;
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
    this.px = x * SCALE_FACTOR;
    this.py = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public setVelocity(cache: Cache, vx: number, vy: number): void {
    const w0 = planeGlobals.w0;
    this.vx = vx;
    this.vy = vy;
    this.setDirection(cache, getAngle(vx, vy));
  }

  /**
   * Returns the collision body for this plane.
   */
  public getRect(): RectangleBody {
    return {
      width: Math.round(planeData[this.planeType].width * 0.8),
      height: Math.round(planeData[this.planeType].height * 0.8),
      center: {
        x: this.x,
        y: this.y
      },
      direction: this.direction
    };
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
