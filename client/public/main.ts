import { loadSpriteSheet } from "../src/render/textures";
import { GameClient } from "../src/client";
import { encodeEntry, getEncodedSize } from "../../dogfight/src/network/packer";
import { SchemaTrooper } from "../../dogfight/src/network/schemas";

let client: GameClient;
const wssPath = "ws://" + location.host;

function init(): void {
  // create game client engine
  client = new GameClient();

  // create connection to server.
  const ws = new WebSocket(wssPath);

  ws.onmessage = (event): void => {
    const cache = JSON.parse(event.data);
    client.updateCache(cache);
  };
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});
