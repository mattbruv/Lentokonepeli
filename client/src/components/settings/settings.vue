<template>
  <div id="settings-overlay">
    <div id="settings">
      <h1>{{ phrases.settings }}</h1>
      <div id="settings-container">
        <Language></Language>
        <Name></Name>
      </div>
      <div v-if="isClient" id="debug-toggle">
        <hr />
        <label>{{ phrases.debug }}</label>
        <input type="checkbox" v-model="debug" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Language from "./language.vue";
import Name from "./name.vue";
import { BuildType } from "../../../../dogfight/src/constants";
import { Localizer } from "../../localization/localizer";
export default Vue.extend({
  components: {
    Language,
    Name
  },
  computed: {
    debug: {
      get() {
        return this.$store.state.viewDebug;
      },
      set(value) {
        this.$store.commit("setDebug", value);
      }
    },
    phrases() {
      return {
        settings: Localizer.get("settings"),
        debug: Localizer.get("showDebug")
      };
    },
    isClient() {
      return process.env.BUILD == BuildType.Client;
    }
  }
});
</script>

<style>
#settings {
  padding: 1rem;
  border-radius: 1rem;
  background-color: #fefefe;
  border: 3px solid black;
  text-align: center;
}
#settings-container {
  display: flex;
}
#settings-container > div {
  margin: 10px;
}
#settings-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 12, 32, 0.5);
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  overflow: auto;
  height: 100%;
  width: 100%;
}
</style>