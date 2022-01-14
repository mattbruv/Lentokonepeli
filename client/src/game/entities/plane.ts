import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { DrawLayer, Entity, } from "../entity";
import { getTexture } from "../resources";

const DIRECTIONS = 256;

export enum PlaneType {
  ALBATROS,
  BRISTOL,
  FOKKER,
  JUNKERS,
  SALMSON,
  SOPWITH,
}

const planeTypeTextureMap = new Map<PlaneType, number>();
planeTypeTextureMap.set(PlaneType.ALBATROS, 4);
planeTypeTextureMap.set(PlaneType.JUNKERS, 5);
planeTypeTextureMap.set(PlaneType.FOKKER, 6);
planeTypeTextureMap.set(PlaneType.BRISTOL, 7);
planeTypeTextureMap.set(PlaneType.SALMSON, 8);
planeTypeTextureMap.set(PlaneType.SOPWITH, 9);


export class Plane extends Entity {
  clientX = 0;
  clientY = 0;
  type = EntityType.PLANE;
  direction = 0;
  planeType = PlaneType.ALBATROS;

  container = new PIXI.Container();
  sprite = new PIXI.Sprite(getTexture("plane6.gif"));

  constructor() {
    super();

    this.sprite.anchor.set(0.5); // center sprite origin

    this.container.addChild(this.sprite);

    this.sprite.zIndex = DrawLayer.Plane;
  }

  getContainer(): PIXI.Container {
    return this.container;
  }

  getRadians() {
    return Math.PI * 2 * this.direction / DIRECTIONS;
  }

  getTexture() {
    const str = "plane" + planeTypeTextureMap.get(this.planeType) + ".gif"
    return getTexture(str);
  }

  redraw() {
    this.sprite.texture = this.getTexture();
    //console.log(this.planeType, PlaneType[this.planeType]);

    const x = this.clientX;
    const y = this.clientY;
    this.sprite.position.set(x, y);

    const rad = this.getRadians();
    // console.log(rad, this.direction)
    this.sprite.rotation = this.getRadians();

  }

  destroy() { }
}
