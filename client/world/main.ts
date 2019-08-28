// import * as PIXI from "pixi.js";
import { loadSpriteSheet } from "../src/render/textures";
import { GameClient } from "../src/client";

let client: GameClient;

function loop(): void {
  client.localEngine.tick();
  window.requestAnimationFrame(loop);
}

function init(): void {
  client = new GameClient();
  client.renderer.centerCamera(-1900, 100);

  // append to document grid
  const grid = document.getElementById("container");
  grid.appendChild(client.renderer.getView());

  window.requestAnimationFrame(loop);
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});
