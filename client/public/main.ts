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
    const data = JSON.parse(event.data);
    console.log(data);
    client.updateState(data);
  };
  console.log(wssPath);
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});
