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

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.spritesheet = spritesheet;
    this.container = new PIXI.Container();

    this.background = new PIXI.Graphics();

    // graphics.lineStyle(2, GRID_COLOR, 1);
    this.background.beginFill(BackgroundColor);
    this.background.drawRect(0, 0, 208, 104);
    this.background.endFill();

    // offset the container so the radar is in the right spot
    // this.radar.setBounds(425, 26, 208, 104);
    this.container.position.set(425, 26);

    this.container.addChild(this.background);
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
