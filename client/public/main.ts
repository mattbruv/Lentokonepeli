import { loadSpriteSheet } from "../src/render/textures";
import { GameClient } from "../src/client";

let client: GameClient;
const wssPath = "ws://" + location.host;

function init(): void {
  // create game client engine
  client = new GameClient();

  // create connection to server.
  const ws = new WebSocket(wssPath);

  ws.onmessage = (event): void => {
    console.log(event.data);
    const data = JSON.parse(event.data);
    client.updateState(data);
  };
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});
