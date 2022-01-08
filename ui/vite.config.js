const path = require("path");

export default {
  resolve: {
    alias: [
      {
        find: "lento-client",
        replacement: path.resolve(__dirname, "../client/src"),
      },
    ],
  },
};
