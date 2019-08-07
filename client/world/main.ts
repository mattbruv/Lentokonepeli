import * as PIXI from "pixi.js";
import { newGameWorld } from "../../dogfight/src/engine/world";
import { loadSpriteSheet, spriteSheet } from "../src/render/textures";

const app = new PIXI.Application({
  width: 750,
  height: 750,
  transparent: true,
  antialias: true
});

const world = newGameWorld();

function init(): void {
  console.log(spriteSheet);
  console.log(world);
  document.body.appendChild(app.view);
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});
