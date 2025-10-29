import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["cjs"],
  dts: false,
  minify: true,
  clean: true,
  shims: true,
});
