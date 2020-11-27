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
  private accelerationSpeed: number;

  private maxY: number;
  private turnStep: number;
  private speedModifier: number;

  private speed: number;
  private angle: number;

  public constructor(
    id: number,
    cache: Cache,
    kind: PlaneType,
    player: number,
    side: Team
  ) {
    super(id);

    this.controlledBy = player;

    this.setData(cache, {
      x: 0,
      y: 0,
      direction: 0,
      health: 255,
      fuel: 255,
      ammo: 255,
      team: side,
      planeType: kind
    });
  }

  // advance the plane simulation
  public tick(cache: Cache, deltaTime: number): void {
    this.move(cache, deltaTime);
    this.burnFuel(cache, deltaTime);
  }

  public setBombs(cache: Cache, numBombs: number): void {
    this.set(cache, "bombs", numBombs);
  }

  public damagePlane(cache: Cache, damageAmount: number): void {
    return;
  }

  public abandonPlane(cache: Cache): void {
    return;
  }

  private move(cache: Cache, deltaTime: number): void {
    // deltatime = milliseconds between frames
    const tstep = deltaTime / 1000;
  }

  private burnFuel(cache: Cache, deltaTime: number): void {
    return;
  }

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public setDirection(cache: Cache, direction: number): void {
    this.set(cache, "direction", direction);
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
