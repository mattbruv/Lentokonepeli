<template>
  <div id="app">
    <Header></Header>
    <Settings v-if="viewSettings"></Settings>
    <Game></Game>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Game from "./game.vue";
import Header from "./header.vue";
import Settings from "./settings/settings.vue";
import { GameObjectType } from "../../../dogfight/src/object";
import { ClientMode } from "../types";
export default Vue.extend({
  name: "App",
  components: {
    Game,
    Header,
    Settings
  },
  computed: {
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
</style>