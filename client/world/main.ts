// import * as PIXI from "pixi.js";
import { loadSpriteSheet } from "../src/render/textures";
import { GameClient } from "../src/client";

let client: GameClient;

const startTime = Date.now();
let lastTick = 0;

function loop(): void {
  const currentTick = Date.now() - startTime;
  const deltaTick = currentTick - lastTick;
  lastTick = currentTick;
  client.localEngine.tick(deltaTick);
  window.requestAnimationFrame(loop);
  // window.setTimeout(loop, 1000 / 20); // simulate 20 ticks
}

function init(): void {
  client = new GameClient();
  client.renderer.centerCamera(-1900, 10);

  // append to document grid
  const grid = document.getElementById("container");
  grid.appendChild(client.renderer.getView());

  window.requestAnimationFrame(loop);
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});
