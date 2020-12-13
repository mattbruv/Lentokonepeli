import { EntityType, Entity } from "../entity";
import { Ownable, isOwnable } from "../ownable";
import {
  Team,
  SCALE_FACTOR,
  ROTATION_DIRECTIONS,
  FacingDirection,
} from "../constants";
import { Cache, CacheEntry } from "../network/cache";
import { InputKey } from "../input";
import { RectangleBody, Rectangle, isCollisionOnAxis } from "../physics/rectangle";
import { directionToRadians, radiansToDirection, mod } from "../physics/helpers";
import { SolidEntity } from "./SolidEntity";
import { Runway } from "./Runway";
import { GameWorld } from "../world/world";
import { PlayerInfo, PlayerStatus } from "./PlayerInfo";
import { trooperGlobals, Man } from "./Man";
import { Bullet, bulletGlobals } from "./Bullet";
import { Bomb } from "./Bomb";
import { BufferedImage } from "../BufferedImage";
import { isRectangleCollision } from "../physics/collision";
import { OwnableSolidEntity } from "./OwnableSolidEntity";

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
    world.createExplosion(x, y, plane.controlledBy.getId(), plane.team);
  }
  world.removeEntity(plane);
}
//require("pixi-shim");

//const PIXI = require("node-pixi.js");
//import { PIXI } from 'node-pixi';
//const app = new PIXI.Application({ forceCanvas: true });
export class Plane extends OwnableSolidEntity {
  public type = EntityType.Plane;
  public controlledBy: PlayerInfo;
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

  public lastBomb: number;
  public lastShot: number;


  public bottomHeight = -1;
  public image: BufferedImage;
  public imagename: string;
  private runway;
  private lastMotorOn;
  private motorOnDelay = 200;
  private takeoffCounter = 0;
  private fuelCounter = 0;
  private dodgeCounter = 0;

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

    this.controlledBy = player;
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
    this.bombs = planeData[kind].maxBombs;
    this.ammo = planeData[kind].maxAmmo;

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
    /*
        let x0 = -30;
        let y0 = 200;
        let lx = 100;
        let ly = 100;
        for (let x = x0; x < x0 + lx; x += 5) {
          for (let y = y0; y < y0 + ly; y += 5) {
            const bullet = new Bullet(
              this.world.nextID(EntityType.Bullet),
              this.world,
              this.world.cache,
              this,
              this.team
            );
            bullet.setPos(world.cache, this.runway.getStartX() + x, this.runway.getStartY() + y)
            world.addObject(bullet);
          }
        }
        */

  }
  getPlayerInfo(): PlayerInfo {
    return this.controlledBy;
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
    this.localY = ((paramRunway.getStartY() - this.getBottomHeight() / 2)) * SCALE_FACTOR;
    if (paramRunway.getDirection() == 0) {
      this.radians = Math.PI;
      this.flipped = true;
    }
    else {
      this.radians = 0.0;
      this.flipped = false;
    }
    this.speed = 0.0;
    this.direction = Math.round((this.radians * 256.0 / 2 * Math.PI));
    // TODO handle this
    //this.playerInfo.setHealth(getMaxHealth());
    //this.playerInfo.setAmmo(getMaxAmmo());
    //this.playerInfo.setFuel(getMaxFuel());
    //this.playerInfo.setBombs(getMaxBombs());
    //this.fuelCounter = 100;
  }

  public getCollisionBounds(): Rectangle {
    let tmp = this.getCollisionImage();
    let r = new Rectangle(this.x, this.y, tmp.width, tmp.height);
    //console.log(r);
    return r;
  }

  public getCollisionImage(): BufferedImage {
    return this.world.getImage(this.imagename + "_rot" + Math.round(this.direction));
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

  // advance the plane simulation
  public tick(cache: Cache, deltaTime: number): void {
    //console.log("Mode: " + this.mode + " X: " + this.x + " Y: " + this.y);
    //this.speed = 0;
    //this.setPos(cache, this.localX / 100, this.localY / 100);
    //this.setDirection(cache, (this.direction + 1) % 256);
    //this.checkCollision();
    //return;
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

  private moveFlying(cache: Cache, deltaTime: number): void {
    this.steer(deltaTime);
    if (this.motorOn) {
      this.accelerate(deltaTime);
    }
    this.run(deltaTime);
    this.movePlane(cache, deltaTime);
    if (this.checkCollision()) { };
    this.shoot(cache, deltaTime);
    this.bomb(cache, deltaTime);
  }

  private moveFalling(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
    this.run(deltaTime);
    this.movePlane(cache, deltaTime);
  }
  private bomb(cache: Cache, deltaTime: number) {
    // add time elapsed to our bomb timer
    if (this.lastBomb <= this.bombDelay) {
      this.lastBomb += deltaTime;
    }
    if (this.isBombing) {
      //console.log("bomb" + plane.lastBomb + " " + plane.bombDelay)
      // is it time to bomb again?
      if (this.lastBomb >= this.bombDelay) {
        // do we have bombs to drop?
        if (this.bombs > 0) {
          this.lastBomb = mod(this.lastBomb, this.bombDelay);
          this.setBombs(cache, this.bombs - 1);

          const bomb = new Bomb(
            this.world.nextID(EntityType.Bomb),
            this.world,
            this.world.cache,
            this,
            this.team
          );

          // set bomb speed/direction relative to plane.
          bomb.setPos(this.world.cache, this.x, this.y);
          bomb.setDirection(this.world.cache, this.direction);
          bomb.setSpeed(this.world.cache, this.speed);
          this.world.addObject(bomb);
        }
      }
    }
  }
  private shoot(cache: Cache, deltaTime: number) {
    // Process machine gun
    if (this.isShooting) {
      // add time elapsed to our shot timer
      this.lastShot += deltaTime;

      // is it time to shoot again?
      if (this.lastShot >= this.shotDelay) {
        // do we have ammo to shoot?
        if (this.ammo > 0) {
          this.lastShot = mod(this.lastShot, this.shotDelay);
          this.ammo--;

          const bullet = new Bullet(
            this.world.nextID(EntityType.Bullet),
            this.world,
            this.world.cache,
            this,
            this.team
          );
          const vx = Math.cos(directionToRadians(this.direction));
          const vy = Math.sin(directionToRadians(this.direction));

          const speed =
            (bulletGlobals.speed + this.speed) *
            SCALE_FACTOR;
          bullet.setVelocity(this.world.cache, speed * vx, speed * vy);

          //plane.set(
          //  world.cache,
          //  "ammo",
          //  Math.round((plane.ammo / plane.maxAmmo) * 255)
          //);

          //const bulletx = Math.round(plane.x + (plane.width * vx) / 2);
          //const bullety = Math.round(plane.y + (plane.width * vy) / 2);

          // set bullet speed/direction relative to plane.
          bullet.setPos(this.world.cache, this.x + Math.cos(directionToRadians(this.direction)) * (this.width / 2 + 2),
            this.y + Math.sin(directionToRadians(this.direction)) * (this.width / 2 + 2));
          this.world.addObject(bullet);
        }
      }
    } else if (this.lastShot < this.shotDelay) {
      this.lastShot += deltaTime;
    }
  }


  private moveLanded(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
    if (this.motorOn && this.lastMotorOn + this.motorOnDelay < Date.now()) {
      this.setMotor(cache, !this.motorOn);
      this.lastMotorOn = Date.now();
      //this.mode = PlaneMode.TakingOff;
      this.setMode(PlaneMode.TakingOff);
    }
  }

  private landed(): void {
    if (this.controlledBy.controlID == this.id) {
      destroyPlane(this.world, this);
      console.log("rm plane");
      //this.world.removeEntity(this);
      // TODO set world.landed

      // getDogfightToolkit().landed(this, this.runway, true);
    }
  }

  private sink(): void {
    this.suicide();
  }

  protected suicide(): void {
    if (this.controlledBy.controlID == this.id) {
      //getDogfightToolkit().killed(new Man(0, 0, this.playerInfo), null, 2);
      //this.world.killed(new Trooper(), null, 2);
      //this.playerInfo.removeKeyListener(this);
      this.world.died(this.controlledBy, this.x, this.y);
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
    }
    if (this.takeoffCounter == 60 || this.takeoffCounter == 70) {
      if (this.flipped) {
        this.steerDown(deltaTime);
      }
      else {
        this.steerUp(deltaTime);
      }
      this.localY += 100;
    }
    if (this.takeoffCounter >= 70) {
      this.setMode(PlaneMode.Flying)
      this.runway = null;
      this.takeoffCounter = 0;
      console.log("takenoff");
    }
    this.direction = radiansToDirection(this.radians);
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
    this.movePlane(cache, deltaTime);
    if (this.motorOn) {
      if (this.fuelCounter > 0) {
        this.fuelCounter -= 1;
      }
      if (this.fuelCounter == 0) {
        if (this.fuel == 0) {
          this.motorOn = false;
        }
        else {
          this.fuel -= 1;
          this.fuelCounter = 100;
        }
      }
      this.accelerate(deltaTime);
    }
    if (this.health < this.maxHealth) {
      //TODO smoke
    }
    let d2 = this.direction;
    this.run(deltaTime);
    this.movePlane(cache, deltaTime);
    this.direction = radiansToDirection(this.radians);
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
    this.set(cache, "direction", direction);
    this.radians = directionToRadians(direction);
  }
  public setMode(mode: number): void {
    this.set(this.world.cache, "direction", mode);
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

    if (!this.checkCollision() || (this.runway.getDirection() == 1 && this.x <= this.runway.getStartX()) || (this.runway.getDirection() == 0 && this.x >= this.runway.getStartX())) {
      console.log("landed");
      console.log(x)
      console.log(this.runway.getStartX())
      console.log(this.runway.getDirection())
      this.landed();
    }

    this.setChanged(true);
    this.setData(cache, { x, y });
    this.set(cache, "direction", radiansToDirection(this.radians));
  }
  public hit(se: SolidEntity) {
    if ((this.mode == PlaneMode.Landing || this.mode == PlaneMode.Landed || this.mode == PlaneMode.TakingOff) && se == this.runway) {
      return;
    }
    //console.log("HHIITT");
    if (this.mode == PlaneMode.Falling) {
      // TODO check for owned by whom => ownable
      if (se.getType() == EntityType.Water) {
        this.sink();
      }
    }
    if (se.getType() == EntityType.Runway) {
      let localRunway: Runway = se as Runway;
      console.log("HHIITT - Runway");
      if (this.mode != PlaneMode.Landing && this.x > localRunway.getLandableX() && this.x + this.width < localRunway.getLandableX() + localRunway.getLandableWidth() && !this.motorOn &&
        this.speed < 250 + this.speedModifier &&
        (!this.flipped && (this.radians < 0.8975979010256552 || this.radians > 5.385587406153931)) ||
        this.flipped && (this.radians < 4.039190554615448 && this.radians > 2.243994752564138)) {
        if (this.flipped) {
          this.radians = Math.PI;
        }
        else {
          this.radians = 0;
        }
        this.direction = radiansToDirection(this.radians);
        this.localY = localRunway.getLandableY() - this.getBottomHeight() / 2;
        console.log("HHIITT - PrLanding!!!");
        if (localRunway.getTeam() == this.getTeam() && ((localRunway.getDirection() == 1 && this.radians == Math.PI) || (localRunway.getDirection() == 0 && this.radians == 0)) && localRunway.reserveFor(2)) {
          this.runway = localRunway;
          this.mode = PlaneMode.Landing;
          this.setMode(PlaneMode.Landing);
          console.log("HHIITT - Landing!!!");
        }
        this.setPos(this.world.cache, Math.round(this.localX / 100), Math.round(this.localY / 100));
        this.setDirection(this.world.cache, this.direction);
        return;
      }
      console.log("crashed " + this.x + " landable" + localRunway.getLandableX());
      localRunway.planeCrash();
      this.fraggedBy(null);
      this.explode(null);
    }
    if (isOwnable(se)) {
      if (se instanceof Plane && se.getType() == EntityType.Plane) { // equivalent  check
        this.health -= 50;
        if (this.health <= 0) {
          this.fraggedBy(se as Ownable);
          this.explode(se as Ownable);
        }
      }
      if (se instanceof Bullet) {
        let b = se as Bullet;
        if (b.getPlayerInfo().getId() != this.getId()) {
          this.health -= 30 * b.getDamageFactor();
          if (this.health <= 0) {
            this.fraggedBy(b);
            this.setMode(PlaneMode.Falling)
          }
        }
      }
      else if (se instanceof Bomb) {
        let b = se as Bomb;
        if (b.getPlayerInfo().getId() != this.getId()) {
          this.fraggedBy(b);
          this.explode(b);
          console.log("bomb kill");
        }
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
          }
          this.setChanged(true);
        }
      }
      else {
        //this.fraggedBy(se);
        //this.explodeBy(se);
      }
    }
    else if (se.getType() == EntityType.Water) {
      this.fraggedBy(null);
      this.sink();
    }
    else if (se.getType() == EntityType.Ground) {
      if (this.mode != PlaneMode.Falling) {
        this.fraggedBy(null);
      }
      this.explode(null);
    }
  }

  public fraggedBy(e: Ownable) {
    if (this.getPlayerInfo().controlID == this.id) {
      this.world.killed(this, e, 1);
    }
  }

  public explode(e: Ownable) {
    if (e == null) {
      this.suicide();
    }
    else {
      if (this.controlledBy.controlID == this.id) {
        this.world.killed(this, e, 2);
        this.world.died(this.controlledBy, this.x, this.y);
      }
      this.world.removeEntity(this);
    }
    this.world.createExplosion(this.x, this.y, this.controlledBy.getId(), this.team);
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
