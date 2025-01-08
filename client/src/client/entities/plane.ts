import { Entity, EntityUpdateCallbacks, Followable, Point } from "./entity";
import * as PIXI from "pixi.js";
import { PlaneProperties } from "dogfight-types/PlaneProperties";
import { PlaneType } from "dogfight-types/PlaneType";
import { Textures } from "../textures";
import { directionToRadians } from "../helpers";

const PLANE_TEXTURE_ID: Record<PlaneType, number> = {
  Albatros: 4,
  Junkers: 5,
  Fokker: 6,
  Bristol: 7,
  Salmson: 8,
  Sopwith: 9,
}

export class Plane implements Entity<PlaneProperties>, Followable {

  private container: PIXI.Container;
  private planeSprite: PIXI.Sprite;

  public props: Required<PlaneProperties> = {
    client_x: 0,
    client_y: 0,
    plane_type: "Albatros",
    direction: 0,
  };

  constructor() {
    this.container = new PIXI.Container();
    this.planeSprite = new PIXI.Sprite();
    this.container.addChild(this.planeSprite)
  }

  public getContainer(): PIXI.Container {
    return this.container
  }

  public getCenter(): Point {
    return {
      x: this.props.client_x ?? 0,
      y: this.props.client_y ?? 0,
    };
  }

  private getTexture() {
    const id = PLANE_TEXTURE_ID[this.props.plane_type];
    const key = `plane${id}.gif`
    return Textures[key as keyof typeof Textures]
  }

  public updateCallbacks: EntityUpdateCallbacks<PlaneProperties> = {
    client_x: () => {
      this.planeSprite.position.x = this.props.client_x
    },
    client_y: () => {
      this.planeSprite.position.y = this.props.client_y
    },
    plane_type: () => {
      this.planeSprite.texture = this.getTexture()
    },
    direction: () => {
      console.log(this.props.direction)
      this.planeSprite.rotation = directionToRadians(this.props.direction)
    }
  };

  public destroy() { }
}
