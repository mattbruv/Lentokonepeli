<template>
  <div id="header">
    <h1>{{ gameName }}</h1>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Localizer } from "../localization/localizer";
export default Vue.extend({
  computed: {
    gameName() {
      return Localizer.get("gameName");
    }
  }
});
</script>

<style>
#header {
  background-color: gray;
}
</style>