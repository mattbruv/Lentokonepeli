import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm()],
  build: {
    // https://github.com/vitejs/vite/issues/6985#issuecomment-1059024994
    // https://github.com/Menci/vite-plugin-top-level-await
    target: "ES2022",
  },
  base: "/Lentokonepeli/",
});
