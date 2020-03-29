import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { PlaneType } from "../../../../dogfight/src/objects/plane";
import { ROTATION_DIRECTIONS } from "../../../../dogfight/src/constants";
import { directionToRadians } from "../../../../dogfight/src/physics/helpers";

const planeImageIDs = {
  [PlaneType.Albatros]: 4,
  [PlaneType.Fokker]: 6,
  [PlaneType.Junkers]: 5,
  [PlaneType.Bristol]: 7,
  [PlaneType.Sopwith]: 9,
  [PlaneType.Salmson]: 8
};

enum FrameStatus {
  Normal,
  Flip1,
  Flip2
}

const frameTextureString = {
  [FrameStatus.Normal]: "planeX.gif",
  [FrameStatus.Flip1]: "planeX_flip1.gif",
  [FrameStatus.Flip2]: "planeX_flip2.gif"
};

export class PlaneSprite extends GameSprite {
  public x: number;
  public y: number;
  public health: number;
  public direction: number;
  public planeType: PlaneType;
  public flipped: boolean;

  private frameStatus: FrameStatus;

  private container: PIXI.Container;
  private spritesheet: PIXI.Spritesheet;

  private plane: PIXI.Sprite;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.frameStatus = FrameStatus.Normal;

    this.x = 0;
    this.y = 0;
    this.health = 100;
    this.direction = 0;
    this.planeType = PlaneType.Albatros;
    this.flipped = false;

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();

    this.plane = new PIXI.Sprite();
    this.plane.anchor.set(0.5);
    this.container.addChild(this.plane);
    this.container.zIndex = DrawLayer.Plane;

    this.renderables.push(this.container);
  }

  private setDirection(): void {
    this.plane.rotation = directionToRadians(this.direction) * -1;
  }

  private setPlaneTexture(): void {
    const number = planeImageIDs[this.planeType];
    const frameStr = frameTextureString[this.frameStatus];
    const textureString = frameStr.replace("X", number.toString());
    this.plane.texture = this.spritesheet.textures[textureString];
  }

  private setFlip(): void {
    const value = this.flipped ? -1 : 1;
    this.plane.scale.y = value;
  }

  public redraw(): void {
    this.setPlaneTexture();
    this.setFlip();
    this.setDirection();
    this.container.position.set(this.x, this.y);
  }

  public destroy(): void {
    //
  }
}