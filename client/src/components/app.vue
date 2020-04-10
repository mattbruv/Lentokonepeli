<template>
  <div id="app">
    <div id="game"></div>
    <!-- <Physics /> -->
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Physics from "./physics.vue";
import { GameObjectType } from "../../../dogfight/src/object";
import { ClientMode } from "../types";
export default Vue.extend({
  name: "App",
  components: {
    Physics
  },
  computed: {
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
  background: linear-gradient(#76afe7, white);
  /* background: linear-gradient(#76afe7, white); */
  margin: 0;
  padding: 0;
}

#game > canvas {
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  border: 10px gray;
}
</style>