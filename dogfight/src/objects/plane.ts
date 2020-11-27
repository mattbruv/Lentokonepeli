import { GameObjectType, GameObject } from "../object";
import {
  Team,
  SCALE_FACTOR,
  ROTATION_DIRECTIONS,
  FacingDirection
} from "../constants";
import { Cache, CacheEntry } from "../network/cache";
import { InputKey } from "../input";
import { RectangleBody } from "../physics/rectangle";
import { directionToRadians, radiansToDirection } from "../physics/helpers";

export enum PlaneType {
  Albatros,
  Junkers,
  Fokker,
  Bristol,
  Salmson,
  Sopwith
}

export enum PlaneMode {
  Flying,
  Landing,
  Landed,
  TakingOff,
  Falling,
  Dodging
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
    maxAmmo: number;
    maxFuel: number;
    maxBombs: number;
    maxHealth: number;
    accelerationSpeed: number;
    maxY: number;
    turnStep: number; // TODO: figure out how these were calculated
    shootDelay: number; // Cooldown time in milliseconds
    speedModifier: number;
  };
}

export const planeData: PlaneInfo = {
  [PlaneType.Albatros]: {
    width: 30,
    height: 16,
    maxAmmo: 95,
    maxFuel: 80,
    maxBombs: 0,
    maxHealth: 135,
    accelerationSpeed: 4.75,
    maxY: -50,
    turnStep: 0.031415926535897934, // Math.PI / SCALE_FACTOR,
    shootDelay: 118,
    speedModifier: 55.0
  },
  [PlaneType.Bristol]: {
    width: 36,
    height: 19,
    maxAmmo: 100,
    maxFuel: 60,
    maxBombs: 0,
    maxHealth: 135,
    accelerationSpeed: 4.85,
    maxY: -20,
    turnStep: 0.036110260386089575,
    shootDelay: 97,
    speedModifier: 0.0
  },
  [PlaneType.Fokker]: {
    width: 38,
    height: 20,
    maxAmmo: 90,
    maxFuel: 90,
    maxBombs: 0,
    maxHealth: 120,
    accelerationSpeed: 5.0,
    maxY: 0,
    turnStep: 0.0483321946706122,
    shootDelay: 120,
    speedModifier: 0.0
  },
  [PlaneType.Junkers]: {
    width: 42,
    height: 19,
    maxAmmo: 100,
    maxFuel: 100,
    maxBombs: 5,
    maxHealth: 160,
    accelerationSpeed: 4.65,
    maxY: 10,
    turnStep: 0.028559933214452663,
    shootDelay: 170,
    speedModifier: 0.0
  },
  [PlaneType.Salmson]: {
    width: 30,
    height: 16,
    maxAmmo: 60,
    maxFuel: 60,
    maxBombs: 5,
    maxHealth: 90,
    accelerationSpeed: 4.7,
    maxY: 65396, // what??
    turnStep: 0.031415926535897934,
    shootDelay: 180,
    speedModifier: 50.0
  },
  [PlaneType.Sopwith]: {
    width: 37,
    height: 20,
    maxAmmo: 80,
    maxFuel: 80,
    maxBombs: 0,
    maxHealth: 120,
    accelerationSpeed: 5.0,
    maxY: 20,
    turnStep: 0.04487989505128276,
    shootDelay: 130,
    speedModifier: 50.0
  }
};

export const teamPlanes: TeamPlanes = {
  [Team.Centrals]: [PlaneType.Albatros, PlaneType.Fokker, PlaneType.Junkers],
  [Team.Allies]: [PlaneType.Bristol, PlaneType.Sopwith, PlaneType.Salmson]
};

const bomberPlanes: PlaneType[] = [PlaneType.Junkers, PlaneType.Salmson];

// Plane global variables
const MAX_Y = 570;
const SKY_HEIGHT = 500;

// Plane physics variables
const AIR_RESISTANCE = 1.0;
const GRAVITY = 6.0;
// TODO: convert to mathematical calculation based on scale
const GRAVITY_PULL = 0.04908738521234052; // large scale

// delays in milliseconds
const flipDelay = 200;
const bombDelay = 500;
const motorOnDelay = 200;

export class Plane extends GameObject {
  public type = GameObjectType.Plane;
  public controlledBy: number;
  public team: Team;
  public planeType: PlaneType;

  public localX: number;
  public localY: number;
  public x: number;
  public y: number;

  public direction: number;
  private flipped: boolean;
  private motorOn: boolean;

  private timerShot: number;
  private timerFlip: number;
  private timerBomb: number;
  private timerMotorOn: number;
  private timerFuel: number;
  private timerTakeoff: number;
  private timerDodge: number;

  public mode: PlaneMode;

  public health: number;
  public ammo: number;
  public bombs: number;
  public fuel: number;

  public maxHealth: number;
  public maxAmmo: number;
  public maxFuel: number;

  private shootDelay: number;
  private maxY: number;
  private turnStep: number;

  private readonly accelerationSpeed: number;
  private readonly speedModifier: number;

  private speed: number;
  private radians: number;

  public constructor(
    id: number,
    cache: Cache,
    kind: PlaneType,
    player: number,
    side: Team
  ) {
    super(id);

    this.controlledBy = player;

    // set plane specific data
    this.accelerationSpeed = planeData[kind].accelerationSpeed;
    this.speedModifier = planeData[kind].speedModifier;

    this.mode = PlaneMode.Flying;
    this.speed = 0;
    this.radians = 0;
    this.localX = 0;
    this.localY = 0;

    this.setData(cache, {
      x: 0,
      y: 0,
      direction: 0,
      health: 255,
      fuel: 255,
      ammo: 255,
      team: side,
      flipped: false,
      motorOn: true,
      planeType: kind
    });
  }

  // advance the plane simulation
  public tick(cache: Cache, deltaTime: number): void {
    this.move(cache, deltaTime);
  }

  public setBombs(cache: Cache, numBombs: number): void {
    this.set(cache, "bombs", numBombs);
  }

  public setFlipped(cache: Cache, value: boolean): void {
    this.set(cache, "flipped", value);
  }

  public damagePlane(cache: Cache, damageAmount: number): void {
    return;
  }

  public abandonPlane(cache: Cache): void {
    return;
  }

  private move(cache: Cache, deltaTime: number): void {
    switch (this.mode) {
      case PlaneMode.Flying: {
        this.moveFlying(cache, deltaTime);
        break;
      }
      case PlaneMode.Falling: {
        this.moveFalling(cache, deltaTime);
        break;
      }
    }
  }

  private getHeightMultiplier(): number {
    // TODO: this entire function
    /*
      double d = (Plane.this.y / 100 - (64966 + Plane.this.getMaxY())) / 150.0D;
      if (d > 1.0D) {
        d = 1.0D;
      }
      return d; */

    return 1.0;
  }

  private accelerate(deltaTime: number): void {
    // TODO: normalize this for deltatime
    this.speed += this.accelerationSpeed * this.getHeightMultiplier();
  }

  private gravity(deltaTime: number): void {
    let d1 = (1.0 - this.speed / 150) * GRAVITY_PULL;

    if (d1 < 0) {
      d1 = 0;
    }

    if (this.radians >= Math.PI * 0.5 && this.radians <= Math.PI * 1.5) {
      d1 = -d1;
    }

    this.radians += d1;

    if (this.radians < 0) {
      this.radians += Math.PI * 2;
    } else if (this.radians >= Math.PI * 2) {
      this.radians -= Math.PI * 2;
    }

    const d2 = GRAVITY * Math.sin(this.radians);
    this.speed += d2;

    if (this.speed < 0) {
      this.speed = 0;
    }
  }

  private airResistance(deltaTime: number): void {
    const s = this.speed - this.speedModifier;
    // TODO: calculate the following constant: 0.00005
    let d = s * s * 5.0e-5;

    if (d < AIR_RESISTANCE) {
      d = AIR_RESISTANCE;
    }

    this.speed -= d;

    if (this.speed < 0) {
      this.speed = 0;
    }
  }

  private movePlane(cache: Cache): void {
    if (this.speed != 0) {
      this.localX += Math.round(
        (SCALE_FACTOR * Math.cos(this.radians) * this.speed) / SCALE_FACTOR
      );
      this.localY += Math.round(
        (SCALE_FACTOR * Math.sin(this.radians) * this.speed) / SCALE_FACTOR
      );
    }
    const x = Math.round(this.localX / SCALE_FACTOR);
    const y = Math.round(this.localY / SCALE_FACTOR);
    this.setData(cache, { x, y });
    this.set(cache, "direction", radiansToDirection(this.radians));
  }

  private run(deltaTime: number): void {
    this.gravity(deltaTime);
    this.airResistance(deltaTime);
  }

  private moveFlying(cache: Cache, deltaTime: number): void {
    // console.log(this.speed, this.localX, this.localY, this.x, this.y);
    // if motor on, subtract fuel
    // if fuel = 0, turn engine off
    // if motor on, accelerate
    if (this.motorOn) {
      this.accelerate(deltaTime);
    }

    this.run(deltaTime);
    this.movePlane(cache);
  }

  private moveLanding(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
  }

  private moveLanded(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
  }

  private moveTakeoff(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
  }

  private moveFalling(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
  }

  private moveDodging(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
  }

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public setDirection(cache: Cache, direction: number): void {
    this.set(cache, "direction", direction);
    this.radians = directionToRadians(direction);
  }

  /*
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "planeType", intType: IntType.Uint8 },
    { name: "team", intType: IntType.Uint8 },
    { name: "direction", intType: IntType.Uint8 },
    { name: "health", intType: IntType.Uint8 },
    { name: "fuel", intType: IntType.Uint8 },
    { name: "ammo", intType: IntType.Uint8 },
    { name: "bombs", intType: IntType.Uint8 }
    */
  public getState(): CacheEntry {
    return {
      type: this.type,
      direction: this.direction,
      planeType: this.planeType,
      team: this.team,
      health: this.health,
      fuel: this.fuel,
      ammo: this.ammo,
      bombs: this.bombs,
      flipped: this.flipped,
      x: this.x,
      y: this.y
    };
  }
}

export function getPlaneRect(
  x: number,
  y: number,
  direction: number,
  type: PlaneType
): RectangleBody {
  return {
    // width: Math.round(planeData[type].width * 0.8),
    // height: Math.round(planeData[type].height * 0.8),
    width: planeData[type].width,
    height: planeData[type].height,
    center: { x, y },
    direction
  };
}
