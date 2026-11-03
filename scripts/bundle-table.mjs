// Bundle the owner's table into frontend/dist, using the backend's installed packages.
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(new URL("../backend/package.json", import.meta.url));
const esbuild = require("esbuild");

const outfile = resolve(root, "frontend/dist/table.js");
await esbuild.build({
  absWorkingDir: resolve(root, "frontend"),
  entryPoints: ["src/table.ts"],
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2020",
  outfile: "dist/table.js",
  nodePaths: [resolve(root, "backend/node_modules")],
});
// The ABI's internal type name is a compiler label. The served file uses the product name.
const { readFileSync, writeFileSync } = await import("node:fs");
writeFileSync(outfile, readFileSync(outfile, "utf8").replaceAll("VaubanVault", "KavonyxVault"));
