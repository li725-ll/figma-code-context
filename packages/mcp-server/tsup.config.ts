import { defineConfig } from "tsup";
import { copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  onSuccess: async () => {
    copyFileSync(resolve(__dirname, "../../README.md"), resolve(__dirname, "README.md"));
  },
});
