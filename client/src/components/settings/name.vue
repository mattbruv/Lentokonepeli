<template>
  <div id="name-settings" v-if="info.id !== undefined">
    <h3>{{ lang.name }}</h3>
    <div>
      <p>{{ info.name }}</p>
      <div id="username">
        <div class="char-count">{{ clientName.length }}/{{ max }}</div>
        <input :class="isValid() ? '' : 'bad-name'" v-model.trim="clientName" />
        <div>
          <button :disabled="!isValid()" @click="submitName">
            {{ lang.updateName }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Cookies from "js-cookie";
import {
  isNameValid,
  NAME_LENGTH_MAX,
} from "../../../../dogfight/src/validation";
import { Localizer } from "../../localization/localizer";
export default Vue.extend({
  data: () => {
    let name = Cookies.get("name");
    if (name === undefined) {
      name = "";
    }
    return {
      clientName: name,
      max: NAME_LENGTH_MAX,
    };
  },
  computed: {
    lang() {
      return {
        updateName: Localizer.get("updateName"),
        name: Localizer.get("name"),
      };
    },
    info() {
      return this.$store.state.client.playerInfo;
    },
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
    },
  },
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