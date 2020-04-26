<template>
  <div id="debug" v-if="noServerMode">
    <label>Debug Object:</label>
    <select v-model="menu">
      <option v-for="item in menuList" :key="item.value" :value="item.value">{{item.name}}</option>
    </select>
    <PlaneDebug v-if="menu == 'plane'"></PlaneDebug>
    <BulletDebug v-if="menu == 'bullet'"></BulletDebug>
    <BombDebug v-if="menu == 'bomb'"></BombDebug>
    <TrooperDebug v-if="menu == 'trooper'"></TrooperDebug>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import PlaneDebug from "./plane.vue";
import BulletDebug from "./bullet.vue";
import BombDebug from "./bomb.vue";
import TrooperDebug from "./trooper.vue";
import {
  PlaneType,
  planeGlobals,
  infoHUD
} from "../../../../dogfight/src/objects/plane";
import { BuildType } from "../../../../dogfight/src/constants";

export default Vue.extend({
  components: {
    PlaneDebug,
    BulletDebug,
    TrooperDebug,
    BombDebug
  },
  data: (): any => {
    return {
      noServerMode: process.env.BUILD == BuildType.Client,
      menu: "plane",
      menuList: [
        {
          name: "Bombs",
          value: "bomb"
        },
        {
          name: "Bullets",
          value: "bullet"
        },
        {
          name: "Planes",
          value: "plane"
        },
        {
          name: "Troopers",
          value: "trooper"
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
