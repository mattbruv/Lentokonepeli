<template>
  <div id="settings-overlay">
    <div id="settings">
      <h1>Settings</h1>
      <label>View Debug Menu</label>
      <input type="checkbox" v-model="debug" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  computed: {
    debug: {
      get() {
        return this.$store.state.viewDebug;
      },
      set(value) {
        this.$store.commit("setDebug", value);
      }
    }
  }
});
</script>

<style>
#settings {
  padding: 1rem;
  border-radius: 1rem;
  background-color: #fefefe;
}
#settings-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  overflow: auto;
  height: 100%;
  width: 100%;
}
</style>