import * as PIXI from "pixi.js";
import { RectangleSprite } from "./rect";
import {
  isRectangleCollision,
  isCircleRectCollision,
  isPointRectCollision
} from "../../dogfight/src/collision";
import { CircleSprite } from "./circle";
import { PointSprite } from "./point";

console.log("collision script");

const app = new PIXI.Application({
  width: 750,
  height: 750,
  transparent: true,
  antialias: true
});

const rect1 = new RectangleSprite();
const rect2 = new RectangleSprite();
const circle = new CircleSprite();
const bullet = new PointSprite();
rect2.sprite.alpha = 0;

function updateCollisions(): void {
  if (isRectangleCollision(rect1.rectObj, rect2.rectObj)) {
    rect1.sprite.tint = 0xff0000;
    rect2.sprite.tint = 0xff0000;
  } else {
    rect1.sprite.tint = rect1.tint;
    rect2.sprite.tint = rect2.tint;
  }
  if (isCircleRectCollision(circle.circleObj, rect1.rectObj)) {
    rect1.sprite.alpha = 0.35;
  } else {
    rect1.sprite.alpha = 1;
  }

  if (isPointRectCollision(bullet.position, rect1.rectObj)) {
    bullet.sprite.scale.set(2);
  } else {
    bullet.sprite.scale.set(1);
  }
}

function addRenderable(container: PIXI.Container): void {
  app.stage.addChild(container);
}

function init(): void {
  document.body.appendChild(app.view);
  addRenderable(rect1.getContainer());
  addRenderable(rect2.getContainer());
  addRenderable(circle.getContainer());
  addRenderable(bullet.getContainer());
  rect1.setCollisionCallback(updateCollisions);
  rect2.setCollisionCallback(updateCollisions);
  circle.setCollisionCallback(updateCollisions);
  bullet.setCollisionCallback(updateCollisions);
}

window.addEventListener("load", (): void => {
  init();
});
