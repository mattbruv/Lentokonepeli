<template>
  <div>
    <h4>Global Physics</h4>
    <p>
      <label>Gravity</label>
      <input type="text" class="statBox" v-model.number="globals.gravity" />
      <br />
      <label>Gravity Feathering</label>
      <input type="text" class="statBox" v-model.number="globals.feather" />
      <br />
      <label>Drag Power</label>
      <input type="text" class="statBox" v-model.number="globals.dragPower" />
      <!-- Current plane physics -->
    </p>
    <p>
      <span v-for="(val, index) in HUD" v-bind:key="index">
        {{ index }}:
        <b>{{ val }}</b>
      </span>
    </p>
    <hr />
    <h4>Plane Physics</h4>
    <select v-model="editPlane">
      <option v-for="name in planeNames" :key="name">{{ name }}</option>
    </select>
    <br />
    <br />
    <div
      v-for="(val, key) in planeInfo[planeID(editPlane)]"
      :key="key"
      :class="isMyPlane(editPlane) ? 'mine': ''"
    >
      <label>{{ planeVarLabels[key] || key }}:</label>
      <input type="text" v-model.number="planeInfo[planeID(editPlane)][key]" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {
  PlaneType,
  planeGlobals,
  infoHUD
} from "../../../../dogfight/src/entities/Plane";
import { BuildType } from "../../../../dogfight/src/constants";
export default Vue.extend({
  data: (): any => {
    return {
      noServerMode: process.env.BUILD == BuildType.Client,
      editPlane: "Albatros",
      planeVarLabels: {
        width: "Hitbox Width",
        height: "Hitbox Height",
        flightTime: "Flight Time",
        ammo: "Ammo",
        fireRate: "Fire Rate",
        thrust: "Thrust",
        maxSpeed: "Max Speed",
        minSpeed: "Stall Speed",
        turnRadius: "Turn Radius",
        maxAltitude: "Max Altitude",
        recoveryAngle: "Recovery Angle",
        glideAngle: "Glide Angle",
        freeDrag: "Drag"
      }
    };
  },
  computed: {
    planeInfo() {
      return this.$store.state.planeInfo;
    },
    globals() {
      return planeGlobals;
    },
    planeNames() {
      return Object.keys(PlaneType).filter(n => isNaN(parseInt(n)));
    },
    HUD() {
      return this.$store.state.infoHUD;
    }
  },
  methods: {
    planeID(name: string): number {
      return PlaneType[name];
    },
    isMyPlane(name: string): boolean {
      const id = PlaneType[name];
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
#debug {
  margin: 1em;
}
.mine {
  background-color: lightblue;
}
</style>
