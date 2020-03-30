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

const flipAnimation = [
  FrameStatus.Flip1,
  FrameStatus.Flip2,
  FrameStatus.Flip1,
  FrameStatus.Normal
];

export class PlaneSprite extends GameSprite {
  public x: number;
  public y: number;
  public health: number;
  public direction: number;
  public planeType: PlaneType;
  public flipped: boolean;

  private flipFrame: number = 0;
  private lastFlipState: boolean = undefined;
  private animatingFlip: boolean = false;

  private frameStatus: FrameStatus;

  private container: PIXI.Container;
  private spritesheet: PIXI.Spritesheet;

  private plane: PIXI.Sprite;

  private lightSmoke: PIXI.Container;
  private lightSmokeInterval: number;

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
    this.lightSmoke = new PIXI.Container();

    this.plane = new PIXI.Sprite();
    this.plane.anchor.set(0.5);
    this.container.addChild(this.plane);
    this.container.zIndex = DrawLayer.Plane;

    this.lightSmokeInterval = window.setInterval((): void => {
      this.createLightSmoke();
    }, 100);

    this.renderables.push(this.container);
    this.renderables.push(this.lightSmoke);
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

  private handleFlip(): void {
    const value = this.flipped ? -1 : 1;
    this.plane.scale.y = value;
    // If our initial flip isn't set yet, we don't want to animate..
    if (this.flipped === undefined) {
      return;
    }
    if (this.lastFlipState === undefined) {
      this.lastFlipState = this.flipped;
    }
    // check to see if the plane has flipped
    if (this.flipped != this.lastFlipState) {
      // If it is our first flip, just render
      // the plane how it should be rendered without animating.
      // perform the flip animation.
      if (this.animatingFlip == false) {
        this.animatingFlip = true;
        this.flipFrame = 0;
        this.animateFlip();
      }
      this.lastFlipState = this.flipped;
    }
  }

  private animateFlip(): void {
    if (this.flipFrame > flipAnimation.length - 1) {
      this.flipFrame = 0;
      this.animatingFlip = false;
      return;
    }
    // set frame status
    this.frameStatus = flipAnimation[this.flipFrame];
    // render texture
    this.setPlaneTexture();
    // increment counter
    this.flipFrame += 1;
    // call animate again.
    window.setTimeout((): void => {
      this.animateFlip();
    }, 80);
  }

  public redraw(): void {
    this.handleFlip();
    this.setPlaneTexture();
    this.setDirection();
    this.container.position.set(this.x, this.y);
  }

  private createLightSmoke(): void {
    const smoketex = this.spritesheet.textures["smoke1.gif"];
    const smoke = new PIXI.Sprite(smoketex);

    // direction = 0 -> 256   2^8
    const radians = directionToRadians(this.direction);
    const halfWidth = Math.round(this.plane.width / 2);
    const offset = Math.round(halfWidth / 6);

    const r = halfWidth + offset;
    const theta = radians * -1;
    const deltaX = r * Math.cos(theta);
    const deltaY = r * Math.sin(theta);
    const newX = this.x - deltaX;
    const newY = this.y - deltaY;
    smoke.position.set(newX, newY);

    this.lightSmoke.addChild(smoke);
    setTimeout((): void => {
      this.lightSmoke.removeChild(smoke);
    }, 200);
  }

  public destroy(): void {
    window.clearInterval(this.lightSmokeInterval);
  }
}
