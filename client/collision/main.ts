import * as PIXI from "pixi.js";
import { RectangleSprite } from "./rect";
import {
  isRectangleCollision,
  isCircleRectCollision,
  isPointRectCollision
} from "../../dogfight/src/physics/collision";
import { CircleSprite } from "./circle";
import { PointSprite } from "./point";
import { loadSpriteSheet, spriteSheet } from "../src/render/textures";
import { dragplane } from "./dragplane";
import { Plane, PlaneType } from "../../dogfight/src/entities/Plane";
import { GameWorld } from "../../dogfight/src/world/world";
import { Bullet } from "../../dogfight/src/entities/Bullet";
import { PlayerInfo } from "../../dogfight/src/entities/PlayerInfo";
import { loadImages } from "../../dogfight/src/images";

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
let plane;
let gw;
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

  let p = new Plane(0, gw, gw.cache, plane.planeType, new PlayerInfo(2, gw, gw.cache), 1, null);
  p.setPos(gw.cache, plane.x, plane.y);
  p.setDirection(gw.cache, plane.direction);
  p.setFlipped(gw.cache, plane.flipped);
  let b = new Bullet(1, gw, gw.cache, bullet.position.x, bullet.position.y, 0, 0, p);
  if (p.checkCollisionWith(b)) {
    bullet.sprite.scale.set(2);
    //console.log("hit");
  }
  else {
    bullet.sprite.scale.set(1);
    //console.log("nohit");

  }
}

function addRenderable(container: PIXI.Container): void {
  app.stage.addChild(container);
}

function init(): void {
  document.body.appendChild(app.view);
  plane = new dragplane(spriteSheet);
  plane.flipped = true;
  plane.direction = 64 / 2 + 0 * 64;
  plane.setDirection();
  addRenderable(rect1.getContainer());
  addRenderable(rect2.getContainer());
  addRenderable(circle.getContainer());
  addRenderable(bullet.getContainer());
  for (const a of plane.renderables) {
    addRenderable(a);
    break;
  }
  plane.update({ planeType: PlaneType.Salmson });
  plane.setCollisionCallback(updateCollisions);
  rect1.setCollisionCallback(updateCollisions);
  rect2.setCollisionCallback(updateCollisions);
  circle.setCollisionCallback(updateCollisions);
  bullet.setCollisionCallback(updateCollisions);
}

window.addEventListener("load", (): void => {
  loadSpriteSheet((): void => {
    loadImages("./assets/images/images.png").then((i) => {
      init();
      gw = new GameWorld(i);
    });
  });
});
