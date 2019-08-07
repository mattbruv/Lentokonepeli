import * as PIXI from "pixi.js";
import { newGameWorld } from "../../dogfight/src/engine/world";
import { loadSpriteSheet, spriteSheet } from "../src/render/textures";
import { RenderWorld, renderNewWorldState } from "../src/render/worldRenderer";

const app = new PIXI.Application({
  width: 750,
  height: 750,
  transparent: true,
  antialias: true
});

const world = newGameWorld();

world.grounds.push({
  position: { x: 30, y: 30 },
  width: 500
});

const renderer: RenderWorld = {
  world: app.stage,
  grounds: []
};

function init(): void {
  renderNewWorldState(renderer, world);
  console.log(spriteSheet);
  console.log(world);
  document.body.appendChild(app.view);
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});
