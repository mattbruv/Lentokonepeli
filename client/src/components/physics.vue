<template>
  <div id="physics">
    <!-- Physics shit goes here -->
    <div></div>
    <div
      class="planevar"
      v-for="(value, id) in planeInfo"
      :key="id"
      v-bind:class="[isMyPlane(id) ? 'mine' : '']"
    >
      <b>{{ planeName(id) }}:</b>
      <br />
      <label>Speed</label>
      <input type="text" v-model="planeInfo[id].speed" />
      <br />
      <label>Turn Rate</label>
      <input type="text" v-model="planeInfo[id].turnRate" />
      <br />
      <label>Flight Time</label>
      <input type="text" v-model="planeInfo[id].flightTime" />
      <br />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { PlaneType } from "../../../dogfight/src/objects/plane";
export default Vue.extend({
  computed: {
    planeInfo() {
      return this.$store.state.planeInfo;
    }
  },
  methods: {
    planeName(id: string): string {
      return PlaneType[id];
    },
    isMyPlane(id: string): boolean {
      const mine = this.$store.state.client.getFollowObject();
      let isMine = false;
      if (mine !== undefined) {
        return mine.planeType == id;
      }
      return isMine;
    },
    updatePlaneVars() {
      console.log(this.id);
      console.log(this.$el.value);
    }
  }
});
</script>

<style>
#physics {
  margin: 1em;
}
.mine {
  background-color: lightblue;
}
.planevar {
  padding: 5px;
  float: left;
}
</style>
