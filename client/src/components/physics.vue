<template>
  <div id="physics">
    <!-- Physics shit goes here -->
    <div>
      <b>Global physics:</b>
      <br />
      <label>Gravity</label>
      <input type="text" v-model.number="globals.gravity" />
      <br />
      <label>Recovery Angle</label>
      <input type="text" v-model.number="globals.recoveryAngle" />
    </div>
    <div
      class="planevar"
      v-for="(value, id) in planeInfo"
      :key="id"
      v-bind:class="[isMyPlane(id) ? 'mine' : '']"
    >
      <b>{{ planeName(id) }}:</b>
      <br />
      <label>Thrust</label>
      <input type="text" v-model.number="planeInfo[id].thrust" />
      <br />
      <label>Max Speed</label>
      <input type="text" v-model.number="planeInfo[id].maxSpeed" />
      <br />
      <label>Stall Speed</label>
      <input type="text" v-model.number="planeInfo[id].minSpeed" />
      <br />
      <label>Turn Radius</label>
      <input type="text" v-model.number="planeInfo[id].turnRadius" />
      <br />
      <label>Max Altitude</label>
      <input type="text" v-model.number="planeInfo[id].maxAltitude" />
      <br />
      <label>Flight Time</label>
      <input type="text" v-model.number="planeInfo[id].flightTime" />
      <br />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { PlaneType, planeGlobals } from "../../../dogfight/src/objects/plane";
export default Vue.extend({
  computed: {
    planeInfo() {
      return this.$store.state.planeInfo;
    },
    globals() {
      return planeGlobals;
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
