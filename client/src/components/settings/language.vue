<template>
  <div id="language">
    <h3>{{ phrases.lang }}</h3>
    <img :src="'./assets/images/flags/' + selectedLang + '.svg'" />
    <select v-model="selectedLang" @change="setLanguage">
      <option v-for="(id, lang) in langs" :value="id" :key="lang">{{ selfName(id) }}</option>
    </select>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Language, Localizer } from "../../localization/localizer";
export default Vue.extend({
  data: () => {
    return {
      selectedLang: Localizer.getLanguage()
    };
  },
  computed: {
    langs() {
      return Language;
    },
    phrases() {
      return {
        lang: Localizer.get("language")
      };
    }
  },
  methods: {
    selfName(langID) {
      return Localizer.getString(langID, "languageName");
    },
    setLanguage() {
      this.$store.commit("setLanguage", this.selectedLang);
    }
  }
});
</script>

<style>
#language {
  min-width: 150px;
}
#language img {
  max-width: 200px;
}
</style>