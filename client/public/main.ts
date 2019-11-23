import { loadSpriteSheet } from "../src/render/textures";
import { GameClient } from "../src/client";

let client: GameClient;

function init(): void {
  client = new GameClient();
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});
