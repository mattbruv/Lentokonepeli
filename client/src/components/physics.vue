<template>
  <div id="physics" v-if="noServerMode">
    <!-- Physics shit goes here -->
    <div
      class="planevar"
      v-for="(value, id) in planeInfo"
      :key="id"
      v-bind:class="[isMyPlane(id) ? 'mine' : '']"
    >
      <b>{{ planeName(id) }}:</b>
      <br />
      <label>Gravity</label>
      <input type="text" v-model.number="planeInfo[id].gravity" />
      <br />
      <label>Recovery Angle</label>
      <input type="text" v-model.number="planeInfo[id].recoveryAngle" />
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
import { BuildType } from "../../../dogfight/src/constants";
export default Vue.extend({
  data: (): any => {
    return {
      noServerMode: process.env.BUILD == BuildType.Client
    };
  },
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
