import { loadSpriteSheet } from "../src/render/textures";
import { GameClient } from "../src/client";
import { foo } from "../../dogfight/src/network/cache";
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
    console.log(event.data);
    const data = JSON.parse(event.data);
    client.updateState(data);
  };
}

window.addEventListener("load", (): void => {
  // loadSpriteSheet(init);
  console.log("HELLO");
  // const foo = encodeEntry(0, test, SchemaTrooper);
  const foo = new Test();
  foo.set("3", true);
  foo.x = 60;
});
