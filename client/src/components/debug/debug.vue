<template>
  <div id="debug" v-if="noServerMode">
    <label>Debug:</label>
    <select v-model="menu">
      <option v-for="item in menuList" :key="item.value" :value="item.value">{{item.name}}</option>
    </select>
    <PlaneDebug v-if="menu == 'plane'"></PlaneDebug>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import PlaneDebug from "./plane.vue";
import {
  PlaneType,
  planeGlobals,
  infoHUD
} from "../../../../dogfight/src/objects/plane";
import { BuildType } from "../../../../dogfight/src/constants";

export default Vue.extend({
  components: {
    PlaneDebug
  },
  data: (): any => {
    return {
      noServerMode: process.env.BUILD == BuildType.Client,
      menu: "plane",
      menuList: [
        {
          name: "Planes",
          value: "plane"
        },
        {
          name: "Other",
          value: "nil"
        }
      ]
    };
  },
  computed: {},
  methods: {}
});
</script>

<style>
#debug {
  width: 100%;
  border: 1px dashed;
  background-color: rgb(255, 246, 232);
  border-radius: 1rem;
  padding: 1rem;
}
</style>
