import path from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import * as pkg from "./package.json";
import dts from "vite-plugin-dts";

const NODE_ENV = process.argv.mode || "development";
const VERSION = pkg.version;

export default {
  build: {
    copyPublicDir: false,
    lib: {
      entry: path.resolve(__dirname, "plugins", "index.ts"),
      name: "EditorPlugins",
      fileName: "index",
    },
  },
  define: {
    NODE_ENV: JSON.stringify(NODE_ENV),
    VERSION: JSON.stringify(VERSION),
  },

  plugins: [
    cssInjectedByJsPlugin(),
    dts({
      entryRoot: path.resolve(__dirname, "plugins"),
      tsconfigPath: "./tsconfig.json",
    }),
  ],
};
