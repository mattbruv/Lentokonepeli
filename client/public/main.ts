import { GameClient } from "../src/client";
// import Cookies from "js-cookie";
// import { Localizer } from "../src/localization/localizer";

import App from "../src/components/app.vue";
import Vue from "vue";
import Vuex from "vuex";
import { VNode } from "vue/types/umd";
import { planeData, infoHUD } from "../../dogfight/src/objects/plane";

Vue.config.productionTip = false;
Vue.use(Vuex);

function init(): void {
  const client = new GameClient();

  const store = new Vuex.Store({
    state: {
      client: client,
      planeInfo: planeData,
      infoHUD: infoHUD
    }
  });

  // create game client engine
  const vm = new Vue({
    el: "#app",
    store,
    render: (h): VNode => h(App)
  });
}

/**
 * Temporary function which adds a language selecton.
 * This will be updated with something prettier
 * in the future, when we use a framework
 * such as Vuejs or react.
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
 */

window.addEventListener("load", (): void => {
  init();
  // loadSpriteSheet(init);
  //  addLanguageSelect();
});
