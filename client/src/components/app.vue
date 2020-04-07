<template>
  <div id="app">
    <h1>test</h1>
    {{ $root.b }}
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: {}
});
</script>