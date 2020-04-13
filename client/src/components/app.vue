<template>
  <table>
    <tr>
      <th>
        <div id="app">
          <div id="game"></div>
        </div>
      </th>
      <th>
        <Physics />
      </th>
    </tr>
  </table>
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
    }
  }
});
</script>