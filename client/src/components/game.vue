<template>
  <div id="game">
    <div id="game-canvas"></div>
    <Debug v-if="isLoaded && viewDebug"></Debug>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Debug from "./debug/debug.vue";

export default Vue.extend({
  components: {
    Debug
  },
  computed: {
    isLoaded() {
      return this.$store.state.client.loadedGame;
    },
    viewDebug() {
      return this.$store.state.viewDebug;
    }
  }
});
</script>

<style>
#game {
  margin: 50px;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}

#game-canvas {
  display: flex;
  align-content: center;
  align-self: center;
}

#game-canvas > canvas {
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}
</style>