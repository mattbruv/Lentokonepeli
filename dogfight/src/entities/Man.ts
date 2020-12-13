import { Team, SCALE_FACTOR } from "../constants";
import { Entity, EntityType } from "../entity";
import { Cache, CacheEntry } from "../network/cache";
import { InputKey } from "../input";
import { RectangleBody, Rectangle } from "../physics/rectangle";
import { GameWorld, } from "../world/world";
import { SolidEntity } from "./SolidEntity";
import { Ownable } from "../ownable";
import { PlayerInfo } from "./PlayerInfo";
import * as json from "../../../dist/assets/images/images.json";
import sharp from 'sharp';
import { OwnableSolidEntity } from "./OwnableSolidEntity";

const info = [json.frames["parachuter0.gif"].frame, json.frames["parachuter1.gif"].frame];
const image = [null, null]
//const image = [sharp("./dist/assets/images/images.png").extract({ left: info[0].x, top: info[0].y, width: info[0].w, height: info[0].h }).toFormat('raw').toBuffer()
//  , sharp("./dist/assets/images/images.png").extract({ left: info[1].x, top: info[1].y, width: info[1].w, height: info[1].h }).toFormat('raw').toBuffer()];


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
  Falling,
  Parachuting,
  Standing,
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
  public direction: TrooperDirection;
  public team: Team;
  public ammo: number;
  public bombs: number; // simply for client rendering 1 bomb.

  public isShooting: boolean;
  public lastShot: number;
  public shotThreshold: number;

  public playerinfo;
  public image;
  public imageWidth;
  public imageHeight;


  public speedPerPixel = 100;



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
    this.setData(cache, {
      x: x,
      y: y,
      ammo: 255,
      bombs: 1,
      health: 255,
      state: TrooperState.Falling,
      direction: TrooperDirection.None,
      team: player.getTeam()
    });
  }
  public getCollisionBounds(): Rectangle {
    return new Rectangle(this.x, this.x, this.width, this.height);
    //throw new Error("Method not implemented.");
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
        this.setState(cache, TrooperState.Walking);
      }
    } else if (this.state == TrooperState.Walking) {
      const speed = trooperGlobals.walkSpeed * SCALE_FACTOR;
      if (this.direction == TrooperDirection.Left) {
        this.localX -= tstep * speed;
      } else if (this.direction == TrooperDirection.Right) {
        this.localX += tstep * speed;
      } else {
        this.setState(cache, TrooperState.Standing);
      }
    }

    //const unitsPerSecond = 100 * SCALE_FACTOR;
    //this.localX = this.localX + Math.round(tstep * unitsPerSecond);
    this.set(cache, "x", Math.round(this.localX / SCALE_FACTOR));
    this.set(cache, "y", Math.round(this.localY / SCALE_FACTOR));
  }

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
        this.localY = (se.getCollisionBounds().y - image[0].getHeight() / 2) * 100;
      }
      else {
        this.fraggedBy(null);
        this.removeSelf();
      }
    }
    else if (se.getType() != EntityType.Ground || (this.state!=TrooperState.Standing) && this.state!= TrooperState.Walking) {
      if(se.getType() == )

    }
  }

  public fraggedBy(o: Ownable): void {
    if (this.getPlayerInfo().getControlId() == this.id) {
      this.world.killed(this, o, 2);
    }
  }

  public removeSelf(): void {
    if (this.getPlayerInfo().controlID == this.id) {
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
      direction: this.direction,
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
