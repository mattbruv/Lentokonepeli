import "../css/style.css";

// must add ?url for vite to import URL as string
import spriteSheetJSONUrl from "../images/images.json?url";

import { GameClient, loadResources } from "lento-client/lib/client";
import ServerList from "../servers.json";

const SERVER = ServerList.dev[0];

let gameClient: GameClient;

loadResources(spriteSheetJSONUrl, () => {
  gameClient = new GameClient();
  gameClient.connect(SERVER, () => {
    gameClient.appendCanvas("#app");
  });
});
