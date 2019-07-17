import * as PIXI from "pixi.js";
import { Rectangle } from "./rect";

console.log("collision script");

const app = new PIXI.Application({
  width: 1000,
  height: 1000,
  transparent: true
});

const rectangles = [];

function addRectangles(): void {
  for (let i = 0; i < 20; i++) {
    const rect = new Rectangle();
    rectangles.push(rect);
    app.stage.addChild(rect.sprite);
  }
}

function init(): void {
  document.body.appendChild(app.view);
  addRectangles();
}

window.addEventListener("load", (): void => {
  init();
});
