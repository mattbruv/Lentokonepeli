// import * as PIXI from "pixi.js";
import { loadSpriteSheet } from "../src/render/textures";
import { GameRenderer } from "../src/render/renderer";
import { entitiesFromMap } from "../../dogfight/src/maps/map";
import { CLASSIC_MAP } from "../../dogfight/src/maps/classic";

let renderer: GameRenderer;

function fitToScreen(): void {
  // renderer.resize(window.innerWidth, window.innerHeight);
}

function init(): void {
  renderer = new GameRenderer();
  // console.log(spriteSheet);
  // document.body.appendChild(renderer.getView());
  const grid = document.getElementById("container");
  grid.appendChild(renderer.getView());
  fitToScreen();

  renderer.centerCamera(-1800, 0);

  const entities = entitiesFromMap(CLASSIC_MAP);
  console.log(entities);

  for (let i = 0; i < entities.length; i++) {
    renderer.addEntity(entities[i]);
  }
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});

window.addEventListener("resize", (): void => {
  fitToScreen();
});
