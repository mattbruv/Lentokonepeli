import { Entity, EntityUpdateCallbacks, Followable, Point, RadarEnabled } from "./entity";
import * as PIXI from "pixi.js";
import { PlaneProperties } from "dogfight-types/PlaneProperties";
import { PlaneType } from "dogfight-types/PlaneType";
import { Textures } from "../textures";
import { directionToRadians } from "../helpers";
import { DrawLayer } from "../constants";
import { Stats } from "../hud";
import { RadarObject, RadarObjectType } from "../radar";

const PLANE_TEXTURE_ID: Record<PlaneType, number> = {
  Albatros: 4,
  Junkers: 5,
  Fokker: 6,
  Bristol: 7,
  Salmson: 8,
  Sopwith: 9,
}

const GRAY_SMOKE_INTERVAL_MS = 100;
const GRAY_SMOKE_LIFETIME_MS = 300;

const BLACK_SMOKE_LIFETIME_MS = 300;

export class Plane implements Entity<PlaneProperties>, Followable, RadarEnabled {

  private container: PIXI.Container;
  private planeSprite: PIXI.Sprite;
  private first_flip: boolean = true;
  private frame = 0;
  private animation_gray_smoke: number;
  private dark_smoke_timeout: number;
  private darkSmoke: PIXI.Container;
  private angle: number = 0;

  public props: Required<PlaneProperties> = {
    client_x: 0,
    client_y: 0,
    client_fuel: 0,
    flipped: false,
    mode: "Flying",
    motor_on: true,
    plane_type: "Albatros",
    direction: 0,
    total_bombs: 0,
    client_ammo: 0,
    client_health: 0
  };

  constructor() {
    this.container = new PIXI.Container();
    this.planeSprite = new PIXI.Sprite();
    this.planeSprite.anchor.set(0.5)
    this.darkSmoke = new PIXI.Container();

    this.container.addChild(this.planeSprite)
    this.container.addChild(this.darkSmoke)

    this.container.zIndex = DrawLayer.Plane;

    this.dark_smoke_timeout = window.setTimeout(() => {
      this.createDarkSmoke();
    });

    this.animation_gray_smoke = window.setInterval(() => {
      if (!this.props.motor_on || this.props.mode !== "Flying") return;

      const tex = this.getTexture();
      const w = tex.width
      const h = tex.height
      const d1 = this.angle

      const x = this.planeSprite.position.x
      const y = this.planeSprite.position.y
      //console.log(this.planeSprite.position)

      let k = Math.floor(x - Math.cos(d1) * ((w / 2) + 6));
      let m = Math.floor(y - Math.sin(d1) * ((h / 2) + 6));

      const smoke = new PIXI.Sprite(Textures["smoke1.gif"])
      smoke.anchor.set(0.5)
      smoke.position.set(k, m)
      //console.log(k, m)
      this.container.addChild(smoke)

      window.setTimeout(() => {
        this.container.removeChild(smoke)
      }, GRAY_SMOKE_LIFETIME_MS)
    }, GRAY_SMOKE_INTERVAL_MS)
  }

  private createDarkSmoke(): void {
    const percentage = this.props.client_health / 255;

    let smokeFrequency = 300;

    if (percentage < 0.9) {
      const smokeTex = Textures["smoke2.gif"]
      const smoke = new PIXI.Sprite(smokeTex)
      const smokePos = this.getSmokePosition(true)

      smoke.anchor.set(0.5)
      smoke.position.set(smokePos.x, smokePos.y)

      this.darkSmoke.addChild(smoke)

      if (percentage <= 0.66) {
        smokeFrequency = 200;
      }
      if (percentage <= 0.33) {
        smokeFrequency = 100;
      }

      window.setTimeout(() => {
        this.darkSmoke.removeChild(smoke)
      }, BLACK_SMOKE_LIFETIME_MS)
    }

    this.dark_smoke_timeout = window.setTimeout((): void => {
      this.createDarkSmoke()
    }, smokeFrequency)
  }

  private getSmokePosition(center: boolean): { x: number, y: number } {
    // direction = 0 -> 256   2^8
    const radians = directionToRadians(this.props.direction);
    const halfWidth = Math.round(this.planeSprite.width / 2);
    const offset = Math.round(halfWidth / 6);

    const r = halfWidth + offset;
    const theta = radians * -1;
    const deltaX = r * Math.cos(theta);
    const deltaY = r * Math.sin(theta);
    let newX: number, newY: number;
    if (center) {
      newX = this.props.client_x;
      newY = this.props.client_y;
    } else {
      newX = this.props.client_x - deltaX;
      newY = this.props.client_y - deltaY;
    }
    return { x: newX, y: newY };
  }

  public getContainer(): PIXI.Container {
    return this.container
  }

  public getStats(): Stats {
    return {
      bombs: this.props.total_bombs,
      fuel: this.props.client_fuel,
      ammo: this.props.client_ammo,
      health: this.props.client_health
    }
  };

  public getCenter(): Point {
    return {
      x: this.props.client_x ?? 0,
      y: this.props.client_y ?? 0,
    };
  }

  private getTexture() {
    const id = PLANE_TEXTURE_ID[this.props.plane_type];
    const flip = this.frame > 0 ? `_flip${this.frame}` : ''
    const key = `plane${id}${flip}.gif`
    return Textures[key as keyof typeof Textures]
  }

  private renderFrame() {
    this.frame++;

    if (this.frame > 2) {
      this.frame = 0;
    }

    const texture = this.getTexture();
    this.planeSprite.texture = texture;

    if (this.frame !== 0) {
      window.setTimeout(() => {
        this.renderFrame()
      }, 80)
    }
  }

  public updateCallbacks: EntityUpdateCallbacks<PlaneProperties> = {
    client_x: () => {
      this.planeSprite.position.x = this.props.client_x
    },
    client_y: () => {
      this.planeSprite.position.y = this.props.client_y
    },
    client_ammo: () => { },
    client_health: () => { },
    client_fuel: () => {
      //console.log("fuel", this.props.client_fuel)
    },

    total_bombs: () => {
      console.log("Bombs", this.props.total_bombs)
    },

    flipped: () => {

      let do_flip = false;
      if (this.first_flip) {
        this.first_flip = false;
      }
      else {
        do_flip = true;
      }

      this.planeSprite.scale.y = (this.props.flipped) ? -1 : 1

      if (do_flip) {
        this.frame = 0;
        this.renderFrame()
        //console.log(this.frame)
      }

      //console.log("flipped", this.props.flipped)
    },

    mode: () => {
      console.log("mode", this.props.mode)
    },

    motor_on: () => {
      console.log("motor on", this.props.motor_on)
    },

    plane_type: () => {
      this.planeSprite.texture = this.getTexture()
    },

    direction: () => {
      // console.log(this.props.direction)
      this.angle = directionToRadians(this.props.direction)
      this.planeSprite.rotation = this.angle
    }
  };

  public destroy() {
    window.clearInterval(this.animation_gray_smoke)
    window.clearTimeout(this.dark_smoke_timeout)
  }

  public getRadarInfo(): RadarObject {
    return {
      type: RadarObjectType.Plane,
      x: this.props.client_x,
      y: this.props.client_y,
    }
  }
}
