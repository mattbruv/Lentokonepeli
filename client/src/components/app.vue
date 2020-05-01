<template>
  <div id="app">
    <Header></Header>
    <Settings v-show="viewSettings"></Settings>
    <Game v-show="conn == states.OPEN"></Game>
    <div v-if="conn == states.CONNECTING">{{ lang.connecting }}</div>
    <div class="error" v-if="conn == states.CLOSED">{{ lang.error }}</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Game from "./game.vue";
import Header from "./header.vue";
import Settings from "./settings/settings.vue";
import { GameObjectType } from "../../../dogfight/src/object";
import { ClientMode } from "../types";
import { ConnectionState } from "../clientState";
import { Localizer } from "../localization/localizer";
export default Vue.extend({
  name: "App",
  components: {
    Game,
    Header,
    Settings
  },
  computed: {
    lang() {
      return {
        connecting: Localizer.get("connecting"),
        error: Localizer.get("connectionError")
      };
    },
    states() {
      return ConnectionState;
    },
    conn() {
      return this.$store.state.clientState.connection;
    },
    viewSettings() {
      return this.$store.state.viewSettings;
    },
    status() {
      const mode = this.$store.state.client.mode;
      return ClientMode[mode];
    },
    loaded() {
      return this.$store.state.client.loadedGame;
    }
  }
});
</script>
<style>
body {
  font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
  background: lightgray;
  /* background: linear-gradient(#76afe7, white); */
  margin: 0;
  padding: 0;
}

.error {
  font-size: 2rem;
  color: red;
  font-weight: bold;
  text-align: center;
}
</style>