// import * as PIXI from "pixi.js";
import { loadSpriteSheet } from "../src/render/textures";
import { CLASSIC_MAP } from "../../dogfight/src/maps/classic";
import { GameClient } from "../src/client";

let client: GameClient;

function init(): void {
  client = new GameClient();
  client.localEngine.loadMap(CLASSIC_MAP);
  client.renderer.centerCamera(-1800, 0);

  // append to document grid
  const grid = document.getElementById("container");
  grid.appendChild(client.renderer.getView());
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});
