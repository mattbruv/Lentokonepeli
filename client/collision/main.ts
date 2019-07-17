import * as PIXI from "pixi.js";
import { Rectangle } from "./rect";

console.log("collision script");

const app = new PIXI.Application({
  width: 1000,
  height: 1000,
  transparent: true
});

const rect1 = new Rectangle();

function init(): void {
  document.body.appendChild(app.view);
  app.stage.addChild(rect1.sprite);
}

window.addEventListener("load", (): void => {
  init();
});
