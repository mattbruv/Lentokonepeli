// import * as PIXI from "pixi.js";
import { loadSpriteSheet, spriteSheet } from "../src/render/textures";
import { GameRenderer } from "../src/render/renderer";
import { entitiesFromMap } from "../../dogfight/src/maps/map";
import { CLASSIC_MAP } from "../../dogfight/src/maps/classic";
import { getUniqueEntityID } from "../../dogfight/src/world/world";

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

  const entities = entitiesFromMap(CLASSIC_MAP);

  for (let i = 0; i < entities.length; i++) {
    renderer.addEntity(entities[i]);
  }

  renderer.deleteEntity(1);
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});

window.addEventListener("resize", (): void => {
  fitToScreen();
});
