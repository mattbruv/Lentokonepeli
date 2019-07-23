import * as PIXI from "pixi.js";
import { RectangleSprite } from "./rect";
import { isRectangleCollision } from "../../dogfight/src/collision";
import { getRotatedRectPoints } from "../../dogfight/src/rectangle";

console.log("collision script");

const app = new PIXI.Application({
  width: 750,
  height: 750,
  transparent: true,
  antialias: true
});

const rect1 = new RectangleSprite();
const rect2 = new RectangleSprite();

function updateCollisions(): void {
  const p1 = getRotatedRectPoints(rect1.rectObj);
  const p2 = getRotatedRectPoints(rect2.rectObj);
  if (isRectangleCollision(p1, p2)) {
    rect1.sprite.tint = 0xff0000;
    rect2.sprite.tint = 0xff0000;
    console.log("collision!");
  } else {
    rect1.sprite.tint = rect1.tint;
    rect2.sprite.tint = rect2.tint;
    console.log("no collision");
  }
}

function addRenderable(container: PIXI.Container): void {
  app.stage.addChild(container);
}

function init(): void {
  document.body.appendChild(app.view);
  addRenderable(rect1.getContainer());
  addRenderable(rect2.getContainer());
  rect1.setCollisionCallback(updateCollisions);
  rect2.setCollisionCallback(updateCollisions);
}

window.addEventListener("load", (): void => {
  init();
});
