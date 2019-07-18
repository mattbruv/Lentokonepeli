import * as PIXI from "pixi.js";
import { Rect } from "./rect";

console.log("collision script");

const app = new PIXI.Application({
  width: 750,
  height: 750,
  transparent: true
});

const rect1 = new Rect();
const rect2 = new Rect();

function init(): void {
  document.body.appendChild(app.view);
  app.stage.addChild(rect1.sprite);
  app.stage.addChild(rect2.sprite);
}

window.addEventListener("load", (): void => {
  init();
});
