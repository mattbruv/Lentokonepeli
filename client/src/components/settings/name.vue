<template>
  <div id="name-settings">
    <h3>Name</h3>
    <div v-if="info.id !== undefined">
      <p>{{ info.name }}</p>
      <div id="username">
        <div class="char-count">{{ clientName.length }}/{{ max }}</div>
        <input :class="isValid() ? '' : 'bad-name'" v-model.trim="clientName" />
        <div>
          <button :disabled="!isValid()" @click="submitName">Update Name</button>
        </div>
      </div>
    </div>
    <div v-else>
      <p>Join the game to change your name.</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Cookies from "js-cookie";
import {
  isNameValid,
  NAME_LENGTH_MAX
} from "../../../../dogfight/src/validation";
export default Vue.extend({
  data: () => {
    return {
      clientName: Cookies.get("name") ?? "",
      max: NAME_LENGTH_MAX
    };
  },
  computed: {
    info() {
      return this.$store.state.client.playerInfo;
    }
  },
  methods: {
    isValid() {
      return isNameValid(this.clientName);
    },
    submitName() {
      const name = this.clientName;
      if (isNameValid(name)) {
        this.$store.commit("updateName", name);
      }
    }
  }
});
</script>

<style>
.bad-name {
  color: red;
}
.char-count {
  font-size: smaller;
}
</style>