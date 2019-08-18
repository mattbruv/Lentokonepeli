// import * as PIXI from "pixi.js";
import { loadSpriteSheet, spriteSheet } from "../src/render/textures";

import { GameRenderer } from "../src/render/renderer";

let renderer: GameRenderer;

function fitToScreen(): void {
  renderer.resize(window.innerWidth, window.innerHeight);
}

function init(): void {
  renderer = new GameRenderer();
  console.log(spriteSheet);
  document.body.appendChild(renderer.getView());
  fitToScreen();
  renderer.centerCamera(0, 0);
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});

window.addEventListener("resize", (): void => {
  fitToScreen();
});
