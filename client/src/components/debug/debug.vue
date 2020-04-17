<template>
  <div id="debug" v-if="noServerMode">
    <PlaneDebug></PlaneDebug>
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
      noServerMode: process.env.BUILD == BuildType.Client
    };
  },
  computed: {},
  methods: {}
});
</script>

<style>
#debug {
  margin: 1em;
}
</style>
