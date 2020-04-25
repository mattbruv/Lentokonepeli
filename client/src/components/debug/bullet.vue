<template>
  <div>
    <h4>Global Physics</h4>
    <p>
      <label>Speed</label>
      <input type="text" v-model.number="info.speed" />
      <br />
      <label>Duration</label>
      <input type="text" v-model.number="info.lifetime" />
      <br />
      <label>Gravity (bombs only)</label>
      <input type="text" v-model.number="info.gravity" />
      <br />
      <label>Drag (bombs only)</label>
      <input type="text" v-model.number="info.drag" />
    </p>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  computed: {
    info() {
      return this.$store.state.bulletInfo;
    }
  }
});
</script>

<style>
</style>