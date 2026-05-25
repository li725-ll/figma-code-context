import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    init: "src/init.ts",
  },
  format: ["esm"],
  target: "node18",
  platform: "node",
  splitting: true,
  clean: true,
  dts: false,
  noExternal: ["@figma/client", "@figma/core"],
  external: ["@modelcontextprotocol/sdk", "zod"],
});
