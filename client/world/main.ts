// import * as PIXI from "pixi.js";
import { loadSpriteSheet, spriteSheet } from "../src/render/textures";

import { GameRenderer } from "../src/render/renderer";

const renderer = new GameRenderer();

function fitToScreen(): void {
  renderer.resize(window.innerWidth, window.innerHeight);
}

function init(): void {
  console.log(spriteSheet);
  document.body.appendChild(renderer.getView());
  fitToScreen();
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});

window.addEventListener("resize", (): void => {
  fitToScreen();
});
