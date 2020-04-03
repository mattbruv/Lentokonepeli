import { loadSpriteSheet } from "../src/render/textures";
import { GameClient } from "../src/client";
import Cookies from "js-cookie";
import { Localizer } from "../src/localization/localizer";
import { encodeCache } from "../../dogfight/src/network/encode";

let client: GameClient;

function init(): void {
  // create game client engine
  // client = new GameClient();

  const foo = encodeCache();
  // console.log(foo);
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
