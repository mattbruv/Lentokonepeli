<template>
  <div id="app">
    <div id="game"></div>
    <div>{{ planes }}</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { GameObjectType } from "../../../dogfight/src/object";
export default Vue.extend({
  computed: {
    planes() {
      return this.$store.state.client.gameObjects[GameObjectType.Plane];
    }
  }
});
</script>