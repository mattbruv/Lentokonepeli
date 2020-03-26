import * as PIXI from "pixi.js";
import { GameObjectType } from "../../../../dogfight/src/object";

const BackgroundColor = 0xc7d3df;

export const radarObjects = [
  GameObjectType.Ground,
  GameObjectType.Runway,
  GameObjectType.Plane,
  GameObjectType.Trooper
];

export class Radar {
  public container: PIXI.Container;

  private spritesheet: PIXI.Spritesheet;

  private background: PIXI.Graphics;
  private radarGraphics: PIXI.Graphics;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.spritesheet = spritesheet;
    this.container = new PIXI.Container();

    this.background = new PIXI.Graphics();
    this.radarGraphics = new PIXI.Graphics();

    this.background.beginFill(BackgroundColor);
    this.background.drawRect(0, 0, 208, 104);
    this.background.endFill();

    // offset the container so the radar is in the right spot
    // this.radar.setBounds(425, 26, 208, 104);
    // this.container.position.set(425, 26);

    // this.container.addChild(this.background);
    this.container.addChild(this.radarGraphics);
  }

  public refreshRadar(gameObjects: any): void {
    this.radarGraphics.clear();
    const grounds = gameObjects[GameObjectType.Ground];
    for (const id in grounds) {
      this.renderGround(grounds[id]);
    }
  }

  public renderGround(ground: any): void {
    /*
      width is 20x smaller than actual size?
      height is 10x smaller?

    */
    const scaleWidth = 10;
    const scaleHeight = 5;
    const { x, y, width } = ground;
    const fromX = 0; //Math.round(-(width / 2) / scaleWidth) + x;
    const fromY = y;
    const lineWidth = Math.round(width / scaleWidth);
    console.log(fromX, fromY, lineWidth, 1);

    this.radarGraphics.beginFill(0x0);
    this.radarGraphics.drawRect(fromX, fromY, lineWidth, 2);
    this.radarGraphics.endFill();
  }
}

/*
int i = localFollowable.getCenterX();
int j = localFollowable.getCenterY();
k = ((Ground)localObject).getX();
m = ((Ground)localObject).getY();

fillRect(
  GROUND:
  (groundX - followX + 1000) * getWidth() / 2000,
  (groundY - followY + 500) * getHeight() / 1000,
  Ground.getWidth() * getHeight() / 1000,
  1
);

*/
