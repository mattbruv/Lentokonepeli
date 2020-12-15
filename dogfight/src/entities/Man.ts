import { Team, SCALE_FACTOR } from "../constants";
import { Entity, EntityType } from "../entity";
import { Cache, CacheEntry } from "../network/cache";
import { InputKey, GameKey } from "../input";
import { RectangleBody, Rectangle } from "../physics/rectangle";
import { GameWorld, } from "../world/world";
import { SolidEntity } from "./SolidEntity";
import { Ownable } from "../ownable";
import { PlayerInfo } from "./PlayerInfo";
import * as json from "../../../dist/assets/images/images.json";
import sharp from 'sharp';
import { OwnableSolidEntity } from "./OwnableSolidEntity";
import { Runway } from "./Runway";
import { Bullet } from "./Bullet";
import { Bomb } from "./Bomb";
import { Plane } from "./Plane";
import { BufferedImage } from "../BufferedImage";



export const trooperGlobals = {
  gravity: 500,
  dragFall: 0.001,
  dragChute: 0.1,
  walkSpeed: 100,
  crashSurviveSpeed: 175,
  fireRate: 119,
  targetRadius: 500
};

export const TrooperHitboxNormal = {
  width: 10,
  height: 10
};

export const TrooperHitboxParachute = {
  width: 20,
  height: 32
};

export enum TrooperState {
  Parachuting,
  Falling,
  Standing,
  Walking_LEFT,
  Walking_RIGHT,
  Walking
}

export enum TrooperDirection {
  None,
  Left,
  Right
}

export class Man extends OwnableSolidEntity {

  public type = EntityType.Trooper;

  public localX: number;
  public localY: number;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public width: number;
  public height: number;
  public health: number;
  public state: TrooperState;
  //public direction: TrooperDirection;
  public team: Team;
  public ammo: number;
  public bombs: number; // simply for client rendering 1 bomb.

  public isShooting: boolean;
  public isBombing: boolean;
  public lastShot: number;
  public shotThreshold: number;

  public playerinfo;
  public image;
  public imageWidth;
  public imageHeight;


  public shootDelay = 500;
  public speedPerPixel = 100;
  private invulnerabilityTime = 200;
  private invulnerabilityTimer;
  private shootTimer = 0;
  private lastX = 0;



  public constructor(id: number, world: GameWorld, cache: Cache, x: number, y: number, player: PlayerInfo) {
    super(id, world, player.getTeam());
    this.playerinfo = player;
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.image = [world.getImage("parachuter0.gif"), world.getImage("parachuter1.gif")];
    this.width = this.image[0].width;
    this.height = this.image[0].height;
    this.isShooting = false;
    this.shotThreshold = Math.round(1000 / (trooperGlobals.fireRate / 60));
    this.lastShot = this.shotThreshold;
    this.lastX = x;
    this.invulnerabilityTimer = Date.now();
    this.vx = 0;
    this.vy = 0;
    this.setData(cache, {
      x: x,
      y: y,
      ammo: 255,
      bombs: 1,
      health: 255,
      state: TrooperState.Falling,
      //direction: TrooperDirection.None,
      team: player.getTeam()
    });
  }
  public getCollisionBounds(): Rectangle {
    return new Rectangle(this.x, this.y, this.width, this.height);
    //throw new Error("Method not implemented.");
  }
  public getCollisionImage(): BufferedImage {
    return this.state == TrooperState.Parachuting ? this.image[1] : this.image[0];
  }
  getPlayerInfo(): import("./PlayerInfo").PlayerInfo {
    return this.playerinfo;
    //throw new Error("Method not implemented.");
  }
  getRootOwner(): OwnableSolidEntity {
    return this;
    //throw new Error("Method not implemented.");
  }
  public parachute(): void {
    this.setState(this.world.cache, TrooperState.Parachuting);
  }

  public tick(cache: Cache, deltaTime: number): void {
    this.move(cache, deltaTime);
  }

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public move(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
    switch (this.state) {
      case TrooperState.Falling:
        this.localX += 100 * this.vx / this.speedPerPixel * tstep * SCALE_FACTOR;
        this.localY -= 100 * this.vy / this.speedPerPixel * tstep * SCALE_FACTOR;
        this.vx -= Math.round((this.vx * 0.01) * tstep * SCALE_FACTOR);
        this.vy += this.speedPerPixel / 30 * tstep * SCALE_FACTOR;
        // TODO parachute condition
        if (this.isKeyPressed(GameKey.MAN_PARACHUTE)) {
          this.parachute();
        }
        if (!this.checkCollision()) { }
        break;
      case TrooperState.Parachuting:
        this.localX += 100 * this.vx / this.speedPerPixel * tstep * SCALE_FACTOR;
        this.localY -= 100 * this.vy / this.speedPerPixel * tstep * SCALE_FACTOR;
        this.vx -= Math.round((this.vx * 0.01) * tstep * SCALE_FACTOR);
        this.vy -= Math.round((this.vy * 0.05) * tstep * SCALE_FACTOR);
        if (this.vy < this.speedPerPixel) {
          this.vy = this.speedPerPixel;
        }
        if (this.isKeyPressed(GameKey.MAN_LEFT)) { //this.direction == TrooperDirection.Left) {
          this.localX -= 100 * tstep * SCALE_FACTOR;
        }
        if (this.isKeyPressed(GameKey.MAN_RIGHT)) { //this.direction == TrooperDirection.Right) {
          this.localX += 100 * tstep * SCALE_FACTOR;
        }
        if (this.isKeyPressed(GameKey.MAN_SHOOT) && this.shootTimer + this.shootDelay < Date.now()) {
          this.shootTimer = Date.now();
          this.shoot();
        }
        if (!this.checkCollision()) { }
        break;
      case TrooperState.Standing:
      case TrooperState.Walking_LEFT:
      case TrooperState.Walking_RIGHT:
        //console.log("step");
        let i = this.state;
        this.state = TrooperState.Standing;
        this.lastX = this.localX;
        if (this.isKeyPressed(GameKey.MAN_LEFT)) { //this.direction == TrooperDirection.Left) { // todo here key pressed?
          this.localX -= 100 * tstep * SCALE_FACTOR;
          if (this.localX / 100 < -45536) { // random bound {
            //this.fraggedBy(null);
            //this.removeSelf();
          }
          this.setState(cache, TrooperState.Walking_LEFT);
        }
        if (this.isKeyPressed(GameKey.MAN_RIGHT)) {
          this.localX += 100 * tstep * SCALE_FACTOR;
          if (this.localX / 100 > 45536) { // random bound {
            //this.fraggedBy(null);
            //this.removeSelf();
          }
          this.setState(cache, TrooperState.Walking_RIGHT);
        }
        if (this.isKeyPressed(GameKey.MAN_SHOOT) && this.shootTimer + this.shootDelay < Date.now()) {
          this.shootTimer = Date.now();
          this.shoot();
        }
        else if (this.isKeyPressed(GameKey.MAN_SUICIDE)) {
          this.world.createExplosion(this.x, this.y, this)
          this.fraggedBy(null);
          this.removeSelf();
        }
        if (this.checkCollision()) { }
        //console.log("endstep");
        break;
    }

    if (!this.isRemoved()) {
      this.setState(cache, this.state);
      this.set(cache, "x", Math.round(this.localX / SCALE_FACTOR));
      this.set(cache, "y", Math.round(this.localY / SCALE_FACTOR));
    }
  }

  private shoot(): void {
    let localMap = this.world.getEntities();
    let i = 250000;
    let localObject1: SolidEntity = null;
    localMap.forEach((list): void => {
      list.forEach((entity): void => {
        if (entity instanceof SolidEntity && entity.getTeam() != this.getTeam()) {
          if (entity instanceof Plane || entity.getType() == EntityType.Trooper) {
            let k = this.countDistance(entity);
            if (k < i) {
              i = k;
              localObject1 = entity;
            }
          }
          if (entity.getType() == EntityType.Runway) {
            let rw = entity as Runway;
            if (rw.isAlive()) {
              let k = this.countDistance(entity);
              if (k < i) {
                i = k;
                localObject1 = entity;
              }
            }
          }
        }
      });
    });

    let d = 4.71238898038469; //
    if (localObject1 != null) {
      d = this.countAngle(localObject1);
    }
    if ((d < 2.199114857512855) && (d > 0.9424777960769379)) {
      if (localObject1 != null) {
        console.log("Shooting down: " + localObject1 + " " + (localObject1).getCollisionBounds() + " " + d + " " + i);
      } else {
        console.log("Shooting down: " + localObject1 + " " + d + " " + i);
      }
    }
    let j = this.localX / 100;
    let m = this.localY / 100 - 10 + this.height / 2;
    console.log("bullet shot");
    const b = new Bullet(
      this.world.nextID(EntityType.Bullet),
      this.world,
      this.world.cache,
      j,
      m,
      -d,
      0,
      this,
    );

    this.world.addEntity(b);
  }

  private countDistance(paramSolidEntity: SolidEntity): number {
    let i = paramSolidEntity.getCollisionBounds().x;
    let j = paramSolidEntity.getCollisionBounds().y;
    let k = this.localX / 100;
    let m = this.localY / 100;
    return (i - k) * (i - k) + (j - m) * (j - m);
  }

  private countAngle(paramSolidEntity: SolidEntity): number {
    let i = paramSolidEntity.getCollisionBounds().x;
    let j = paramSolidEntity.getCollisionBounds().y;
    let k = this.localX / 100;
    let m = this.localY / 100;
    return Math.atan2(j - m, i - k);
  }

  /*
  public move_old(cache: Cache, deltaTime: number): void {
    const tstep = deltaTime / 1000;
    if (this.state == TrooperState.Falling) {
      const drag = trooperGlobals.dragFall;
      const dragForceY = drag * Math.pow(this.vy / SCALE_FACTOR, 2);
      this.vy -= Math.sign(this.vy) * dragForceY + trooperGlobals.gravity;
      this.localY += tstep * this.vy;
    } else if (this.state == TrooperState.Parachuting) {
      const drag = trooperGlobals.dragChute;
      const dragForceY = drag * Math.pow(this.vy / SCALE_FACTOR, 2);
      this.vy -= Math.sign(this.vy) * dragForceY + trooperGlobals.gravity;
      const speed = trooperGlobals.walkSpeed * SCALE_FACTOR;
      if (this.direction == TrooperDirection.Left) {
        this.vx = -speed;
      } else if (this.direction == TrooperDirection.Right) {
        this.vx = speed;
      } else {
        this.vx = 0;
      }
      this.localX += tstep * this.vx;
      this.localY += tstep * this.vy;
    } else if (this.state == TrooperState.Standing) {
      if (this.direction != TrooperDirection.None) {
        if (!this.isRemoved()) this.setState(cache, TrooperState.Walking);
      }
    } else if (this.state == TrooperState.Walking) {
      const speed = trooperGlobals.walkSpeed * SCALE_FACTOR;
      if (this.direction == TrooperDirection.Left) {
        this.localX -= tstep * speed;
      } else if (this.direction == TrooperDirection.Right) {
        this.localX += tstep * speed;
      } else {
        if (!this.isRemoved()) this.setState(cache, TrooperState.Standing);
      }
    }

    //const unitsPerSecond = 100 * SCALE_FACTOR;
    //this.localX = this.localX + Math.round(tstep * unitsPerSecond);
    if (!this.isRemoved()) {
      this.set(cache, "x", Math.round(this.localX / SCALE_FACTOR));
      this.set(cache, "y", Math.round(this.localY / SCALE_FACTOR));
    }
  }
  */

  public setVelocity(cache: Cache, vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
  }

  public setState(cache: Cache, state: TrooperState): void {
    this.set(cache, "state", state);
  }

  public setDirection(cache: Cache, key: InputKey, doWalk: boolean): void {
    let newDirection = TrooperDirection.None;
    if (doWalk) {
      if (key == InputKey.Left) {
        newDirection = TrooperDirection.Left;
      } else {
        newDirection = TrooperDirection.Right;
      }
    }
    this.set(cache, "direction", newDirection);
  }

  public hit(se: SolidEntity): void {
    if (se.getType() == EntityType.Ground && (this.state == TrooperState.Falling || this.state == TrooperState.Parachuting)) {
      if (this.vy < this.speedPerPixel * 1.5) {
        this.setState(this.world.cache, TrooperState.Standing);
        this.localY = (se.getCollisionBounds().y + this.image[0].getHeight() / 2) * 100;
        console.log("landed - ground ");
        this.set(this.world.cache, "y", Math.round(this.localY / SCALE_FACTOR));
      }
      else {
        this.fraggedBy(null);
        this.removeSelf();
      }
    }
    else if (se.getType() != EntityType.Ground || (this.state != TrooperState.Standing && this.state != TrooperState.Walking_LEFT && this.state != TrooperState.Walking_RIGHT)) {
      if (se.getType() == EntityType.Runway) {
        console.log("landed - runway");
        if ((this.state == TrooperState.Standing) || (this.state == TrooperState.Walking_LEFT) || (this.state == TrooperState.Walking_RIGHT)) {
          if (se.getTeam() == this.getTeam()) {
            this.respawn(se as Runway);
          }
          else {
            this.x = this.lastX;
          }
        }
        else if (se.getTeam() != this.getTeam()) {
          this.fraggedBy(null);
          this.removeSelf();
        }

      }
      else if (se.getType() == EntityType.ControlTower) {
        console.log("landed - tower");
        if ((this.state == TrooperState.Standing) || (this.state == TrooperState.Walking_LEFT) || (this.state == TrooperState.Walking_RIGHT)) {
          this.x = this.lastX;
        }
        else {
          this.fraggedBy(null);
          this.removeSelf();
        }
      }
      else if (se.getType() == EntityType.Bullet) {
        let b = se as Bullet;
        if (!(b.getPlayerInfo().getId() == this.getPlayerInfo().getId())) {
          this.fraggedBy(b);
          this.removeSelf();
        }
      }
      else if (se.getType() == EntityType.Bomb) {
        let b = se as Bomb;
        this.fraggedBy(b);
        this.removeSelf();
      }
      else if (se instanceof Plane) {
        if (Date.now() >= this.invulnerabilityTimer + this.invulnerabilityTime) {
          this.fraggedBy(se as Plane);
          this.removeSelf()
        }
      }
      else if (se.getType() == EntityType.Water) {  //|| se.getType() == 23) { // TODO what is 23 ?!?!
        this.fraggedBy(null);
        this.removeSelf();
      }
    }
  }

  public respawn(r: Runway): void {
    if (this.getPlayerInfo().isControlling(this)) {
      this.world.removeEntity(this);
      this.world.landed(this, r);
    }
  }

  public fraggedBy(o: Ownable): void {
    if (this.getPlayerInfo().isControlling(this)) {
      console.log("fragged - self")
      this.world.killed(this, o, 2);
    }
  }

  public removeSelf(): void {
    if (this.getPlayerInfo().isControlling(this)) {
      console.log("rm - self")
      this.world.removeEntity(this);
      let r = this.getCollisionBounds();
      this.world.died(this, r.x, r.y);
    }
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      health: this.health,
      state: this.state,
      //direction: this.direction,
      ammo: this.ammo,
      bombs: this.bombs,
      team: this.team
    };
  }
}

export function getTrooperRect(
  x: number,
  y: number,
  state: TrooperState
): RectangleBody {
  let hboxWidth = TrooperHitboxNormal.width;
  let hboxHeight = TrooperHitboxNormal.height;
  if (state == TrooperState.Parachuting) {
    hboxWidth = TrooperHitboxParachute.width;
    hboxHeight = TrooperHitboxParachute.height;
  }
  return {
    width: hboxWidth,
    height: hboxHeight,
    center: {
      x,
      y: y + Math.round(hboxHeight / 2)
    },
    direction: 0
  };
}
