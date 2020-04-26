<template>
  <div>
    <h4>Global Physics</h4>
    <p>
      <label>Gravity</label>
      <input type="text" v-model.number="info.gravity" />
      <br />
      <label>Drag</label>
      <input type="text" v-model.number="info.drag" />
      <br />
      <label>Cooldown</label>
      <input type="text" v-model.number="info.cooldown" />
    </p>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  computed: {
    info() {
      return this.$store.state.bombInfo;
    }
  }
});
</script>

<style>
</style>