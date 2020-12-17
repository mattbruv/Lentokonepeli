import { EntityType, Entity } from "../entity";
import { Ownable, isOwnable } from "../ownable";
import {
  Team,
  SCALE_FACTOR,
  ROTATION_DIRECTIONS,
  FacingDirection,
} from "../constants";
import { Cache, CacheEntry } from "../network/cache";
import { InputKey, GameKey } from "../input";
import { RectangleBody, Rectangle, isCollisionOnAxis } from "../physics/rectangle";
import { directionToRadians, radiansToDirection, mod } from "../physics/helpers";
import { SolidEntity } from "./SolidEntity";
import { Runway } from "./Runway";
import { GameWorld, } from "../world/world";
import { PlayerInfo, PlayerStatus } from "./PlayerInfo";
import { trooperGlobals, Man } from "./Man";
import { Bullet, bulletGlobals } from "./Bullet";
import { Bomb } from "./Bomb";
import { BufferedImage } from "../BufferedImage";
import { isRectangleCollision } from "../physics/collision";
import { OwnableSolidEntity } from "./OwnableSolidEntity";
import { Explosion } from "./Explosion";


export enum PlaneType {
  Albatros,
  Junkers,
  Fokker,
  Bristol,
  Salmson,
  Sopwith,
}

export const planeImageIDs = {
  [PlaneType.Albatros]: 4,
  [PlaneType.Fokker]: 6,
  [PlaneType.Junkers]: 5,
  [PlaneType.Bristol]: 7,
  [PlaneType.Sopwith]: 9,
  [PlaneType.Salmson]: 8
};

export enum FrameStatus {
  Normal,
  Flip1,
  Flip2
}

export const frameTextureString = {
  [FrameStatus.Normal]: "planeX.gif",
  [FrameStatus.Flip1]: "planeX_flip1.gif",
  [FrameStatus.Flip2]: "planeX_flip2.gif"
};

export const flipAnimation = [
  FrameStatus.Flip1,
  FrameStatus.Flip2,
  FrameStatus.Flip1,
  FrameStatus.Normal
];
export enum PlaneMode {
  Flying,
  Landing,
  Landed,
  TakingOff,
  Falling,
  Dodging,
}

export enum PlaneRotation {
  None,
  Up,
  Down,
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
    accelerationSpeed: number; // units per second, original code runs every ~100ms
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
    accelerationSpeed: 475,
    maxY: -50,
    turnStep: Math.PI, // Math.PI / SCALE_FACTOR,
    shootDelay: 118,
    speedModifier: 55.0,
  },
  [PlaneType.Bristol]: {
    width: 36,
    height: 19,
    maxAmmo: 100,
    maxFuel: 60,
    maxBombs: 0,
    maxHealth: 135,
    accelerationSpeed: 485,
    maxY: -20,
    turnStep: 3.6110260386089575, // TODO: figure this out mathematically
    shootDelay: 97,
    speedModifier: 0.0,
  },
  [PlaneType.Fokker]: {
    width: 38,
    height: 20,
    maxAmmo: 90,
    maxFuel: 90,
    maxBombs: 0,
    maxHealth: 120,
    accelerationSpeed: 500,
    maxY: 0,
    turnStep: 4.83321946706122,
    shootDelay: 120,
    speedModifier: 0.0,
  },
  [PlaneType.Junkers]: {
    width: 42,
    height: 19,
    maxAmmo: 100,
    maxFuel: 100,
    maxBombs: 5,
    maxHealth: 160,
    accelerationSpeed: 465,
    maxY: 10,
    turnStep: 2.8559933214452663,
    shootDelay: 170,
    speedModifier: 0.0,
  },
  [PlaneType.Salmson]: {
    width: 30,
    height: 16,
    maxAmmo: 60,
    maxFuel: 60,
    maxBombs: 5,
    maxHealth: 90,
    accelerationSpeed: 470,
    maxY: -150,//65396, // what??
    turnStep: Math.PI,
    shootDelay: 180,
    speedModifier: 50.0,
  },
  [PlaneType.Sopwith]: {
    width: 37,
    height: 20,
    maxAmmo: 80,
    maxFuel: 80,
    maxBombs: 0,
    maxHealth: 120,
    accelerationSpeed: 500,
    maxY: 20,
    turnStep: 4.487989505128276,
    shootDelay: 130,
    speedModifier: 50.0,
  },
};

export const teamPlanes: TeamPlanes = {
  [Team.Centrals]: [PlaneType.Albatros, PlaneType.Fokker, PlaneType.Junkers],
  [Team.Allies]: [PlaneType.Bristol, PlaneType.Sopwith, PlaneType.Salmson],
};

const bomberPlanes: PlaneType[] = [PlaneType.Junkers, PlaneType.Salmson];

// Plane global variables
const MAX_Y = 570;
const SKY_HEIGHT = 500;

// Plane physics variables
const AIR_RESISTANCE = 1.0;
const GRAVITY = -600; // per seecond, sign switched to negative
// I think the y direction is reversed in the original
// TODO: convert to mathematical calculation based on scale
const GRAVITY_PULL = 4.908738521234052; // per second

// delays in milliseconds
const flipDelay = 200;
const motorOnDelay = 200;
const bombDelay = 500;

export function destroyPlane(
  world: GameWorld,
  plane: Plane,
  doExplosion: boolean = false
): void {
  const x = plane.x;
  const y = plane.y;
  // set player info to pre-flight
  //const player = world.getPlayerControlling(plane);
  let player = plane.getPlayerInfo();
  if (player != undefined) {
    player.setStatus(world.cache, PlayerStatus.Takeoff);
    player.setControl(world.cache, EntityType.None, 0);
  }
  if (doExplosion) {
    world.createExplosion(x, y, plane);
  }
  world.removeEntity(plane);
}
//require("pixi-shim");

//const PIXI = require("node-pixi.js");
//import { PIXI } from 'node-pixi';
//const app = new PIXI.Application({ forceCanvas: true });
export class Plane extends OwnableSolidEntity {
  public type = EntityType.Plane;
  public playerInfo: PlayerInfo;
  public team: Team;
  public planeType: PlaneType;

  public localX: number;
  public localY: number;
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  public direction: number;
  public flipped: boolean;
  public motorOn: boolean;

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
  public maxBombs: number;

  public shotDelay: number;
  public bombDelay: number;

  private maxY: number;
  private turnStep: number;

  private readonly accelerationSpeed: number;
  private readonly speedModifier: number;

  public speed: number;
  private radians: number;

  private rotateStatus: PlaneRotation;

  public isAbandoned: boolean;
  public isBombing: boolean;
  public isShooting: boolean;

  public lastBomb: number = 0;
  public lastShot: number = 0;


  public bottomHeight = -1;
  public image: BufferedImage;
  public imagename: string;
  private runway: Runway;
  private lastMotorOn = 0;
  private motorOnDelay = 200;
  private takeoffCounter = 0;
  private fuelCounter = 0;
  private dodgeCounter = 0;
  private lastFlip = 0;
  private flipDelay = 200;

  public constructor(
    id: number,
    world: GameWorld,
    cache: Cache,
    kind: PlaneType,
    player: PlayerInfo,
    side: Team,
    runway: Runway
  ) {
    super(id, world, side);

    this.playerInfo = player;
    this.isAbandoned = false;
    this.rotateStatus = PlaneRotation.None;


    this.lastBomb = 0;
    this.lastShot = 0;
    // set plane specific data
    this.accelerationSpeed = planeData[kind].accelerationSpeed;
    this.speedModifier = planeData[kind].speedModifier;
    this.turnStep = planeData[kind].turnStep;
    this.maxY = planeData[kind].maxY;
    this.shotDelay = planeData[kind].shootDelay;
    this.bombDelay = bombDelay;
    this.width = planeData[kind].width;
    this.height = planeData[kind].height;
    this.maxBombs = planeData[kind].maxBombs;
    this.maxAmmo = planeData[kind].maxAmmo;
    this.bombs = this.maxBombs;
    this.ammo = this.maxAmmo;

    this.mode = PlaneMode.Flying;
    this.speed = 0;
    this.radians = 0;
    this.localX = 0;
    this.localY = 0;


    this.imagename = frameTextureString[FrameStatus.Normal].replace("X", planeImageIDs[kind].toString());
    this.image = world.getImage(this.imagename);

    this.runway = runway;

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
      mode: this.mode,
      planeType: kind,
    });
    //return;
    if (runway != null) {
      let x0 = -30;
      let y0 = 400;
      let lx = 50;
      let ly = 50;

      let x = this.runway.getStartX();
      y0 = this.runway.getStartY();
      for (let y = y0; y < y0 + ly; y += 5) {
        const bullet = new Bullet(
          this.world.nextID(EntityType.Bullet),
          this.world,
          this.world.cache,
          x, y,
          0, -4,
          this,
        );
        world.addEntity(bullet);
      }

      x = this.runway.getLandableX();
      y0 = this.runway.getLandableY();
      for (let y = y0; y < y0 + ly; y += 5) {
        const bullet = new Bullet(
          this.world.nextID(EntityType.Bullet),
          this.world,
          this.world.cache,
          x, y,
          0, -4,
          this,
        );
        world.addEntity(bullet);
      }

      x = runway.getLandableX() + runway.getLandableWidth()
      y0 = this.runway.getLandableY();
      for (let y = y0; y < y0 + ly; y += 5) {
        const bullet = new Bullet(
          this.world.nextID(EntityType.Bullet),
          this.world,
          this.world.cache,
          x, y,
          0, -4,
          this,
        );
        world.addEntity(bullet);
      }

      ///*
      x0 = -30;
      y0 = 200;
      lx = 50;
      ly = 50;
      for (let x = x0; x < x0 + lx; x += 5) {
        for (let y = y0; y < y0 + ly; y += 5) {
          const bullet = new Bullet(
            this.world.nextID(EntityType.Bullet),
            this.world,
            this.world.cache,
            this.runway.getStartX() + x, this.runway.getStartY() + y,
            0, -4,
            this,
          );
          world.addEntity(bullet);
        }
      }
      //*/
    }
  }
  getPlayerInfo(): PlayerInfo {
    return this.playerInfo;
  }
  getRootOwner(): OwnableSolidEntity {
    return this;
  }

  public init(): void {
    this.park(this.runway);
    this.mode = PlaneMode.TakingOff;
    //this.mode = PlaneMode.Flying;
    this.motorOn = true;

    // Update cache
    const x = Math.round(this.localX);
    const y = Math.round(this.localY);
    this.setData(this.world.cache, { x, y });
    this.set(this.world.cache, "direction", radiansToDirection(this.radians));

  }

  private park(paramRunway: Runway): void {
    this.localX = (paramRunway.getStartX()) * SCALE_FACTOR;
    this.localY = ((paramRunway.getStartY() - this.getBottomHeight() / 2 + this.height / 2)) * SCALE_FACTOR;
    if (paramRunway.getDirection() == 0) {
      this.radians = Math.PI;
      this.flipped = true;
    }
    else {
      this.radians = 0.0;
      this.flipped = false;
    }
    this.speed = 0.0;
    this.setDirection(this.world.cache, radiansToDirection(this.radians));
    // TODO handle this
    this.playerInfo.setHealth(this.getMaxHealth());
    this.playerInfo.setAmmo(this.getMaxAmmo());
    this.playerInfo.setFuel(this.getMaxFuel());
    this.playerInfo.setBombs(this.getMaxBombs());
    this.fuelCounter = 100;
  }
  public getMaxHealth() {
    return this.maxHealth;
  }
  public getMaxAmmo() {
    return this.maxAmmo;
  }
  public getMaxFuel() {
    return this.maxFuel;
  }
  public getMaxBombs() {
    return this.maxBombs;
  }

  public getCollisionBounds(): Rectangle {
    let tmp = this.getCollisionImage();
    let r = new Rectangle(this.x, this.y, tmp.width, tmp.height);
    //console.log(r);
    return r;
  }

  public getCollisionImage(): BufferedImage {
    //console.log("get image " + this.imagename + "_rot" + Math.round(this.direction));
    console.log("rot: " + Math.round(this.direction), " flip:" + this.flipped);
    return this.world.getImage(this.imagename + "_rot_" + Math.round(this.direction) + "_flip_" + this.flipped);
  }

  private getBottomHeight(): number {
    if (this.bottomHeight == -1) {

      let arrayOfInt = this.image.data;
      //int[] arrayOfInt = this.image.getRGB(0, 0, this.image.getWidth(), this.image.getHeight(), null, 0, this.image.getHeight());
      for (let i = this.image.height - 1; i >= 0; i--) {
        for (let j = 0; j < this.image.width; j++) {
          if (arrayOfInt[(i * this.image.width + j)] < 0) {
            this.bottomHeight = (i + 1);
            return this.bottomHeight;
          }
        }
      }
      this.bottomHeight = 0;
      return this.bottomHeight;
    }
    console.log("bottom height: " + this.bottomHeight);
    return this.bottomHeight;
  }

  private prevmode;
  // advance the plane simulation
  public tick(cache: Cache, deltaTime: number): void {
    //console.log("Mode: " + this.mode + " X: " + this.x + " Y: " + this.y);
    //this.speed = 0;
    //this.setPos(cache, this.localX / 100, this.localY / 100);
    //this.setDirection(cache, (this.direction + 1) % 256);
    //this.checkCollision();
    //return;
    if (this.prevmode != this.mode) {
      console.log("plane mode: " + this.mode);
      this.prevmode = this.mode;
    }
    switch (this.mode) {
      case PlaneMode.Landing:
        this.moveLanding(cache, deltaTime);
        break;
      case PlaneMode.Landed:
        this.moveLanded(cache, deltaTime);
        break;
      case PlaneMode.TakingOff:
        this.moveTakeoff(cache, deltaTime);
        break;
      case PlaneMode.Flying:
        this.moveFlying(cache, deltaTime);
        break;
      case PlaneMode.Dodging:
        this.moveDodging(cache, deltaTime);
        break;
      case PlaneMode.Falling:
        this.moveFalling(cache, deltaTime);
        break;
    }
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

  public setMotor(cache: Cache, value: boolean): void {
    this.mode = PlaneMode.Flying; // value ? PlaneMode.Flying : PlaneMode.Falling;
    this.set(cache, "motorOn", value);
  }

  public abandonPlane(cache: Cache): void {
    this.isAbandoned = true;
    this.damagePlane(cache, 99999);
    this.setMotor(cache, false);
    this.rotateStatus = PlaneRotation.None;
    //this.controlledBy = null;
    // this.isShooting = false;
    // this.isBombing = false;
  }

  public setRotation(key: InputKey, doRotate: boolean): void {
    if (doRotate == false) {
      this.rotateStatus = PlaneRotation.None;
      return;
    }
    if (key == InputKey.Left) {
      this.rotateStatus = PlaneRotation.Up;
    } else if (key == InputKey.Right) {
      this.rotateStatus = PlaneRotation.Down;
    }
  }




  private getHeightMultiplier(): number {
    let d = -(this.localY / SCALE_FACTOR - (570 - this.maxY)) / 150.0;
    //console.log(d);
    if (d > 1.0) {
      d = 1.0;
    }
    return d;
  }

  private accelerate(deltaTime: number): void {
    const tstep = deltaTime / 1000;
    const accel = this.accelerationSpeed * this.getHeightMultiplier();
    this.speed += accel * tstep;
  }

  private gravity(deltaTime: number): void {
    const tstep = deltaTime / 1000;
    const pull = GRAVITY_PULL * tstep;
    //console.log(this.speed);

    let d1 = (1.0 - this.speed / 150) * pull;

    if (d1 < 0) {
      d1 = 0;
    }

    if (this.radians >= Math.PI * 0.5 && this.radians <= Math.PI * 1.5) {
      d1 = -d1;
    }

    this.radians -= d1;

    if (this.radians < 0) {
      this.radians += Math.PI * 2;
    } else if (this.radians >= Math.PI * 2) {
      this.radians -= Math.PI * 2;
    }

    const d2 = GRAVITY * tstep * Math.sin(this.radians);
    this.speed += d2;

    if (this.speed < 0) {
      this.speed = 0;
    }
  }

  private airResistance(deltaTime: number): void {
    const tstep = deltaTime / 1000;
    const s = this.speed - this.speedModifier;
    // TODO: calculate the following constant: 0.00005
    let d = s * s * 5.0e-5;

    if (d < AIR_RESISTANCE) {
      d = AIR_RESISTANCE;
    }

    this.speed -= d * tstep * SCALE_FACTOR;

    if (this.speed < 0) {
      this.speed = 0;
    }
  }

  private movePlane(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
    if (this.speed != 0) {
      this.localX += Math.round(
        (SCALE_FACTOR * Math.cos(this.radians) * this.speed * tstep)
      );
      this.localY += Math.round(
        (SCALE_FACTOR * Math.sin(this.radians) * this.speed * tstep)
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

  private steer(deltaTime: number): void {
    const tstep = deltaTime / 1000;
    const turnRate = this.turnStep;
    const delta = (this.speed / SCALE_FACTOR / 4) * turnRate * tstep;
    //console.log(tstep);
    switch (this.rotateStatus) {
      case PlaneRotation.Up: {
        this.radians += delta;
        if (this.radians >= Math.PI * 2) {
          this.radians -= Math.PI * 2;
        }
        break;
      }
      case PlaneRotation.Down: {
        this.radians -= delta;
        if (this.radians < 0) {
          this.radians += Math.PI * 2;
        }
        break;
      }
    }
  }

  private steerUp(deltaTime): void {
    const tstep = deltaTime / 1000;
    const turnRate = this.turnStep;
    const delta = (this.speed / SCALE_FACTOR / 4) * turnRate * tstep;
    this.radians += delta;
    if (this.radians >= Math.PI * 2) {
      this.radians -= Math.PI * 2;
    }
  }
  private steerDown(deltaTime): void {
    const tstep = deltaTime / 1000;
    const turnRate = this.turnStep;
    const delta = (this.speed / SCALE_FACTOR / 4) * turnRate * tstep;
    this.radians -= delta;
    if (this.radians < 0) {
      this.radians += Math.PI * 2;
    }
  }

  private moveEngine(cache: Cache, deltaTime: number): void {
    if (this.motorOn) {
      if (this.fuelCounter > 0) {
        this.fuelCounter -= 1;
      }
      if (this.fuelCounter == 0) {
        if (this.getPlayerInfo().getFuel() == 0) {
          this.setMotor(cache, false);
        }
        else {
          this.getPlayerInfo().setFuel(this.getPlayerInfo().getFuel() - 1);
          this.fuelCounter = 100;
        }
      }
      this.accelerate(deltaTime);
      //TODO server side smoke ?!?!
    }
    if (this.getPlayerInfo().getHealth() < this.maxHealth) {
      //TODO server side black smoke ?!?!
    }
  }

  private moveFlying(cache: Cache, deltaTime: number): void {
    if (this.isKeyPressed(GameKey.PLANE_FLIP) && (this.lastFlip + this.flipDelay < Date.now())) {
      this.setFlipped(cache, !this.flipped);
      this.lastFlip = Date.now();
    }
    //this.steer(deltaTime);
    if (this.isKeyPressed(GameKey.PLANE_DOWN)) {
      this.steerDown(deltaTime);
    }
    if (this.isKeyPressed(GameKey.PLANE_UP)) {
      this.steerUp(deltaTime);
    }
    if (this.isKeyPressed(GameKey.PLANE_MOTOR) && (this.lastMotorOn + this.motorOnDelay < Date.now()) && this.fuelCounter > 0) {
      console.log("plane - motor toggle");
      this.setMotor(cache, !this.motorOn);
      this.lastMotorOn = Date.now();
    }
    this.moveEngine(cache, deltaTime);

    this.run(deltaTime);
    this.movePlane(cache, deltaTime);
    if (this.checkCollision()) { }; // TODO only check collision if plane direction or position changed // not very important atm 
    this.shoot(cache, deltaTime);
    this.bomb(cache, deltaTime);
    this.jump(cache, deltaTime);
  }

  private moveFalling(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
    //TODO serverside black smoke ?
    this.run(deltaTime);
    this.movePlane(cache, deltaTime);
    if (!this.checkCollision()) { }
    this.jump(cache, deltaTime, false);
  }

  private jump(cache: Cache, deltaTime: number, frag: boolean = true) {
    if (this.isKeyPressed(GameKey.PLANE_JUMP) && this.getPlayerInfo().isControlling(this)) {
      if (frag) this.fraggedBy(null);
      console.log("plane - jump");
      let localMan = new Man(
        this.world.nextID(EntityType.Trooper),
        this.world,
        this.world.cache,
        this.localX / SCALE_FACTOR,
        this.localY / SCALE_FACTOR,
        this.getPlayerInfo()
      );
      this.world.addEntity(localMan);
      this.getPlayerInfo().setControl(this.world.cache, EntityType.Trooper, localMan.getId());
      this.setMode(PlaneMode.Falling);
      this.getPlayerInfo().submitParachute(this, localMan);
      //TODO clear pressed keys?
    }
  }
  private bomb(cache: Cache, deltaTime: number) {
    // add time elapsed to our bomb timer
    if (this.isKeyPressed(GameKey.PLANE_BOMB) && this.lastBomb + this.bombDelay < Date.now() && this.getPlayerInfo().getBombs() > 0) {
      this.setBombs(cache, this.bombs - 1);

      const bomb = new Bomb(
        this.world.nextID(EntityType.Bomb),
        this.world,
        this.world.cache,
        this.x,
        this.y,
        this.direction,
        this.speed / SCALE_FACTOR,
        this,
      );
      this.world.addEntity(bomb);

      this.lastBomb = Date.now();
      this.getPlayerInfo().setBombs(this.getPlayerInfo().getBombs() - 1);

      // set bomb speed/direction relative to plane.
      //bomb.setPos(this.world.cache, this.x, this.y);
      //bomb.setDirection(this.world.cache, this.direction);
      //bomb.setSpeed(this.world.cache, this.speed);
    }
  }
  private shoot(cache: Cache, deltaTime: number) {
    if (this.isKeyPressed(GameKey.PLANE_SHOOT) && this.lastShot + this.shotDelay < Date.now() && this.getPlayerInfo().getAmmo() > 0) {
      const bullet = new Bullet(
        this.world.nextID(EntityType.Bullet),
        this.world,
        this.world.cache,
        this.x + Math.cos(directionToRadians(this.direction)) * (this.width / 2 + 2),
        this.y + Math.sin(directionToRadians(this.direction)) * (this.width / 2 + 2),
        this.radians,
        this.speed / SCALE_FACTOR,
        this,
      );
      this.world.addEntity(bullet);
      this.lastShot = Date.now();
      this.getPlayerInfo().setAmmo(this.getPlayerInfo().getAmmo() - 1);
    }
  }


  private moveLanded(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
    if (this.isKeyPressed(GameKey.PLANE_MOTOR) && this.lastMotorOn + this.motorOnDelay < Date.now()) {
      this.setMotor(cache, !this.motorOn);
      this.lastMotorOn = Date.now();
      //this.mode = PlaneMode.TakingOff;
      this.setMode(PlaneMode.TakingOff);
    }
  }

  private landed(): void {
    if (this.getPlayerInfo().isControlling(this)) {
      destroyPlane(this.world, this);
      console.log("rm landed plane");
      this.world.removeEntity(this);
      // TODO set world.landed

      // getDogfightToolkit().landed(this, this.runway, true);
    }
  }

  private sink(): void {
    this.suicide();
  }

  protected suicide(): void {
    if (this.getPlayerInfo().isControlling(this)) {
      console.log("suicide - sitting");
      //getDogfightToolkit().killed(new Man(0, 0, this.playerInfo), null, 2);
      //this.world.killed(new Trooper(), null, 2);
      //this.playerInfo.removeKeyListener(this);
      this.world.died(this, this.x, this.y);
    }
    this.world.removeEntity(this);
  }

  private moveTakeoff(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
    if (this.checkCollision()) { }
    this.accelerate(deltaTime);
    this.takeoffCounter += 1;
    if (this.takeoffCounter == 65 || this.takeoffCounter == 75) {
      if (this.flipped) {
        this.steerDown(deltaTime);
      }
      else {
        this.steerUp(deltaTime);
      }
      console.log("takeoff steer");
    }
    if (this.takeoffCounter == 60 || this.takeoffCounter == 70) {
      if (this.flipped) {
        this.steerDown(deltaTime);
      }
      else {
        this.steerUp(deltaTime);
      }
      console.log("takeoff jump");
      this.localY += 100;
    }
    if (this.takeoffCounter >= 70) {
      this.setMode(PlaneMode.Flying)
      this.runway = null;
      this.takeoffCounter = 0;
      console.log("takenoff");
    }
    //this.direction = radiansToDirection(this.radians);
    if (this.speed != 0) {
      this.localX += Math.cos(this.radians) * this.speed * tstep * SCALE_FACTOR;
    }
    this.setChanged(true);


    // Update cache
    const x = Math.round(this.localX / SCALE_FACTOR);
    const y = Math.round(this.localY / SCALE_FACTOR);
    this.setData(cache, { x, y });
    this.set(cache, "direction", radiansToDirection(this.radians));
  }

  private moveDodging(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
    this.moveEngine(cache, deltaTime);
    this.movePlane(cache, deltaTime);

    let d2 = this.direction;
    this.run(deltaTime);
    this.movePlane(cache, deltaTime);
    //this.direction = radiansToDirection(this.radians);
    let i = 0;
    if (this.direction != d2) {
      i = 1;
    }
    if (++this.dodgeCounter > 40) {
      this.mode = 0;
      this.dodgeCounter = 0;
    }
    else if (this.dodgeCounter == 10) {
      this.flipped = (!this.flipped);
    }
    else if (this.dodgeCounter == 20) {
      this.flipped = (!this.flipped);
    }
    else if (this.dodgeCounter == 30) {
      this.flipped = (!this.flipped);
    }
    if (i != 0) {
      if (this.checkCollision()) { }
      i = 0;
    }
    //setChanged(True);

    // Update cache
    const x = Math.round(this.localX / SCALE_FACTOR);
    const y = Math.round(this.localY / SCALE_FACTOR);
    this.setData(cache, { x, y });
    this.set(cache, "direction", radiansToDirection(this.radians));
  }

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public setDirection(cache: Cache, direction: number): void {
    this.radians = directionToRadians(direction);
    this.set(cache, "direction", direction);
  }
  public setMode(mode: number): void {
    this.set(this.world.cache, "mode", mode);
    this.mode = mode;
  }

  private moveLanding(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
    console.log("landing " + this.radians);
    if (this.speed > 100) {
      //?
      this.speed -= 3;
    }
    if (this.speed < 100) {
      //?
      this.speed += 3;
    }
    if (Math.abs(this.speed - 100) < 3) {
      this.speed = 100;
    }
    if (this.speed != 0) // TODO weird check
    {
      this.localX += Math.cos(this.radians) * this.speed;
    }
    const x = Math.round(this.localX / SCALE_FACTOR);
    const y = Math.round(this.localY / SCALE_FACTOR);
    let col = true;//this.checkCollision();
    if (!col || (this.runway.getDirection() == 1 && x <= this.runway.getStartX()) || (this.runway.getDirection() == 0 && x >= this.runway.getStartX())) {
      console.log("landed");
      console.log(col)
      console.log(x)
      console.log(this.runway.getStartX())
      console.log(this.runway.getDirection())
      this.landed();
    }
    this.setChanged(true);
    if (!this.isRemoved()) {
      this.setData(cache, { x, y });
      this.set(cache, "direction", radiansToDirection(this.radians));
    }
  }
  public hit(se: SolidEntity) {
    if ((this.mode == PlaneMode.Landing || this.mode == PlaneMode.Landed || this.mode == PlaneMode.TakingOff) && se == this.runway) {
      return;
    }
    //console.log("HHIITT");
    if (this.mode == PlaneMode.Falling) {
      if (se instanceof OwnableSolidEntity && se.getPlayerInfo().getId() == this.getPlayerInfo().getId()) {
        return;
      }
      if (se instanceof Plane) {
        return;
      }
      // TODO check for owned by whom => ownable
      if (se.getType() == EntityType.Water) {
        console.log("falling - sank");
        this.sink();
      }
      else if (se.getType() != EntityType.Bullet && se.getType() != EntityType.Trooper) {
        console.log("falling - exploded");
        if (se instanceof OwnableSolidEntity) {
          this.explode(se);
        }
        else {
          this.explode(null);
        }
      }
      return;
    }
    if (se.getType() == EntityType.Runway) {
      let localRunway: Runway = se as Runway;
      console.log("HHIITT - Runway");
      if (this.mode != PlaneMode.Landing && this.localX / SCALE_FACTOR > localRunway.getLandableX() && this.localX / SCALE_FACTOR + this.width / 2 < localRunway.getLandableX() + localRunway.getLandableWidth() && !this.motorOn &&
        this.speed < 250 + this.speedModifier &&
        (!this.flipped && (2 * Math.PI - this.radians < 0.8975979010256552 || 2 * Math.PI - this.radians > 5.385587406153931)) ||
        this.flipped && (2 * Math.PI - this.radians < 4.039190554615448 && 2 * Math.PI - this.radians > 2.243994752564138)) {
        if (this.flipped) {
          this.radians = Math.PI;
        }
        else {
          this.radians = 0;
        }
        //this.direction = radiansToDirection(this.radians);
        this.localY = (localRunway.getLandableY() - this.getBottomHeight() / 2 + this.height / 2) * SCALE_FACTOR;
        console.log("HHIITT - PrLanding!!!");
        if (localRunway.getTeam() == this.getTeam() && ((localRunway.getDirection() == 1 && this.radians == Math.PI) || (localRunway.getDirection() == 0 && this.radians == 0)) && localRunway.reserveFor(2)) {
          this.runway = localRunway;
          //this.mode = PlaneMode.Landing;
          this.setMode(PlaneMode.Landing);
          console.log("HHIITT - Landing!!!");
        }
        this.setPos(this.world.cache, Math.round(this.localX / 100), Math.round(this.localY / 100));
        this.set(this.world.cache, "direction", radiansToDirection(this.radians));
        return;
      }
      console.log("crashed " + this.x + " landable" + localRunway.getLandableX());
      localRunway.planeCrash();
      //this.fraggedBy(null);
      //this.explode(null);
    }
    if (se instanceof OwnableSolidEntity) {
      if (se instanceof Explosion) { // equivalent  check
        this.health -= 50;
        if (this.health <= 0) {
          this.fraggedBy(se as Ownable);
          this.explode(se as Ownable);
          console.log("explosion kill");
        }
      }
      else if (se.getPlayerInfo().getId() != this.getPlayerInfo().getId()) {
        if (se instanceof Bullet) {
          let b = se as Bullet;
          this.health -= 30 * b.getDamageFactor();
          if (this.health <= 0) {
            this.fraggedBy(b);
            this.setMode(PlaneMode.Falling)
            console.log("bullet kill");
          }
        }
        else if (se instanceof Bomb) {
          let b = se as Bomb;
          this.fraggedBy(b);
          this.explode(b);
          console.log("bomb kill");
        }
        else if (se instanceof Plane) {
          if (this.mode == PlaneMode.Flying) {
            this.setMode(PlaneMode.Dodging);
            this.radians += (Math.random() - 0.5) * 0.7853981633974483;
            this.health -= 25;
            this.flipped = !this.flipped;
            if (this.health <= 0) {
              this.fraggedBy(se);
              this.setMode(PlaneMode.Falling)
              console.log("dodge kill");
            }
            this.setChanged(true);
          }
        }
        else {
          console.log("ownabel hit kill");
          this.fraggedBy(se);
          this.explode(se);
        }
      }
    }
    else if (se.getType() == EntityType.Water) {
      this.fraggedBy(null);
      this.sink();
      console.log("plane - sank");
    }
    //else if (se.getType() == EntityType.Ground) {
    else {//if (se.getType() == EntityType.Ground) {
      //if (this.mode != PlaneMode.Falling) {
      //  //this.fraggedBy(null);
      //}
      if (se.getType() == EntityType.Ground) {
        console.log("plane - ground");
        return;
      }
      console.log("plane - obj " + se);
      this.fraggedBy(null);
      this.explode(null);
    }
  }

  public fraggedBy(e: Ownable) {
    if (this.getPlayerInfo().isControlling(this)) {
      this.world.killed(this, e, 1);
    }
  }

  public explode(e: Ownable) {
    if (e == null) {
      this.suicide();
    }
    else {
      if (this.getPlayerInfo().isControlling(this)) {
        this.world.killed(this, e, 2);
        this.world.died(this, this.x, this.y);
      }
      this.world.removeEntity(this);
    }
    this.world.createExplosion(this.x, this.y, this);
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
      //health: this.health,
      //fuel: this.fuel,
      //ammo: this.ammo,
      //bombs: this.bombs,
      flipped: this.flipped,
      mode: this.mode,
      x: this.x,
      y: this.y,
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
    direction,
  };
}
