import { loadSpriteSheet } from "../src/render/textures";
import { GameClient } from "../src/client";
import { pack, unpack } from "../../dogfight/src/network/packer";
import Cookies from "js-cookie";
import { Localizer } from "../src/localization/localizer";
import { PacketType } from "../../dogfight/src/network/types";

let client: GameClient;
const wssPath = "ws://" + location.host;

function init(): void {
  // create game client engine
  client = new GameClient();

  // create connection to server.
  const ws = new WebSocket(wssPath);

  ws.onopen = (): void => {
    ws.send(pack({ type: PacketType.RequestFullSync }));
  };

  ws.onmessage = (event): void => {
    const packet = unpack(event.data);
    client.processPacket(packet);
  };
}

/**
 * Temporary function which adds a language selecton.
 * This will be updated with something prettier
 * in the future, when we use a framework
 * such as Vuejs or react.
 */
function addLanguageSelect(): void {
  const selector = document.createElement("select");
  selector.id = "language";
  const cookie = Cookies.get("language");
  for (const key in Localizer.dictionary) {
    const option = document.createElement("option");
    option.value = key;
    option.text = key;
    if (cookie === key) {
      option.selected = true;
    }
    selector.appendChild(option);
  }
  selector.onchange = (ev): void => {
    const target = ev.target as HTMLSelectElement;
    const newLanguage = target.value;
    client.updateLanguage(newLanguage);
  };
  document.body.appendChild(selector);
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
  addLanguageSelect();
});
