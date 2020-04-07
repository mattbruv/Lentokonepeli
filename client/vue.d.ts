// The typescript config needs this file to be included
// because VScode complains if you import a vue file without it.
// https://github.com/microsoft/TypeScript-Vue-Starter#single-file-components
declare module "*.vue" {
  import Vue from "vue";
  export default Vue;
}
