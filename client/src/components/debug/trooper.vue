<template>
  <div>
    <h4>Global Physics</h4>
    <div v-for="(val, key) in info" :key="key">
      <label>{{ labels[key] || key }}:</label>
      <input type="text" v-model.number="info[key]" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data: () => {
    return {
      labels: {
        gravity: "Gravity",
        dragFall: "Drag Falling",
        dragChute: "Drag Parachute",
        walkSpeed: "Walking Speed",
        crashSurviveSpeed: "Falling Survival Speed",
        fireRate: "Fire Rate",
        targetRadius: "Target Radius"
      }
    };
  },
  computed: {
    info() {
      return this.$store.state.trooperInfo;
    }
  }
});
</script>

<style>
</style>