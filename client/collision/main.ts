import * as PIXI from "pixi.js";
import { RectangleSprite } from "./rect";

console.log("collision script");

const app = new PIXI.Application({
  width: 750,
  height: 750,
  transparent: true,
  antialias: true
});

const rect1 = new RectangleSprite();
const rect2 = new RectangleSprite();

function addRenderable(container: PIXI.Container): void {
  app.stage.addChild(container);
}

function init(): void {
  document.body.appendChild(app.view);
  addRenderable(rect1.getContainer());
  addRenderable(rect2.getContainer());
}

window.addEventListener("load", (): void => {
  init();
});
