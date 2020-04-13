<template>
  <div id="physics" v-if="noServerMode">
    <!-- Physics shit goes here -->
    <div align="left" padding="5px">
      <b>Global physics:</b>
      <br />
      <label class="statLabel">Gravity</label>
      <input type="text" class="statBox" v-model.number="globals.gravity" />
      <!-- Current plane physics -->
      <span v-for="(val, index) in HUD" v-bind:key="index">
        {{ index }}:
        <b>{{ val }}</b>
      </span>
    </div>
    <div
      class="planevar"
      v-for="(value, id) in planeInfo"
      :key="id"
      v-bind:class="[isMyPlane(id) ? 'mine' : '']"
      align="left"
    >
      <b>{{ planeName(id) }}:</b>
      <br />
      <label class="statLabel">Recovery Angle</label>
      <input type="text" class="statBox" v-model.number="planeInfo[id].recoveryAngle" />
      <br />
      <label class="statLabel">Glide Angle</label>
      <input type="text" class="statBox" v-model.number="planeInfo[id].glideAngle" />
      <br />
      <label class="statLabel">Thrust</label>
      <input type="text" class="statBox" v-model.number="planeInfo[id].thrust" />
      <br />
      <label class="statLabel">Drag</label>
      <input type="text" class="statBox" v-model.number="planeInfo[id].freeDrag" />
      <br />
      <label class="statLabel">Max Speed</label>
      <input type="text" class="statBox" v-model.number="planeInfo[id].maxSpeed" />
      <br />
      <label class="statLabel">Stall Speed</label>
      <input type="text" class="statBox" v-model.number="planeInfo[id].minSpeed" />
      <br />
      <label class="statLabel">Turn Radius</label>
      <input type="text" class="statBox" v-model.number="planeInfo[id].turnRadius" />
      <br />
      <label class="statLabel">Max Altitude</label>
      <input type="text" class="statBox" v-model.number="planeInfo[id].maxAltitude" />
      <br />
      <label class="statLabel">Flight Time</label>
      <input type="text" class="statBox" v-model.number="planeInfo[id].flightTime" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {
  PlaneType,
  planeGlobals,
  infoHUD
} from "../../../dogfight/src/objects/plane";
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
    },
    HUD() {
      return this.$store.state.infoHUD;
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
  font-size: 14px;
}
.statLabel {
  display: inline-block;
  width: 100px;
}
.statBox {
  float: "right";
  width: 80px;
}
.mine {
  background-color: lightblue;
}
.planevar {
  padding: 5px;
  float: left;
}
</style>
