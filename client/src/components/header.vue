<template>
  <div id="header">
    <a @click="toggleSettings">
      <i :class="viewSettings ? 'header-clicked' : ''" class="material-icons">settings</i>
    </a>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Localizer } from "../localization/localizer";
export default Vue.extend({
  computed: {
    gameName() {
      return Localizer.get("gameName");
    },
    viewSettings() {
      return this.$store.state.viewSettings;
    }
  },
  methods: {
    toggleSettings() {
      this.$store.state.viewSettings = !this.$store.state.viewSettings;
    }
  }
});
</script>

<style>
#header {
  position: fixed;
  top: 0;
  right: 0;
  margin: 1rem;
  z-index: 69;
}
.material-icons {
  font-size: 2rem;
}
#header a {
  cursor: pointer;
}
.header-clicked {
  color: white;
  animation-name: icon-clicked;
  font-size: 3rem;
  animation-duration: 1s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

@keyframes icon-clicked {
  50% {
    text-shadow: 0 0 2rem white;
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>