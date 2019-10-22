import { loadSpriteSheet, spriteSheet } from "../src/render/textures";
import { GameRenderer } from "../src/render/renderer";

let world: GameRenderer;

function init(): void {
  world = new GameRenderer();

  const body = document.getElementById("app");
  body.appendChild(world.app.view);
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});
