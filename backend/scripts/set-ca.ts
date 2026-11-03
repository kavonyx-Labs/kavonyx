// KVNX is a proposed symbol. This script will not publish a contract address,
// a chart, or a claim that a token is deployed.
//
//   node --experimental-strip-types scripts/set-ca.ts --unset
import { writeFileSync } from "node:fs";

const TOKEN = new URL("../../frontend/public/token.json", import.meta.url);
const body = {
  live: false,
  ticker: "KVNX",
  chain: 56,
  ca: "",
  links: { buy: "", chart: "" },
};

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes("--unset")) {
  writeFileSync(TOKEN, JSON.stringify(body, null, 2) + "\n");
  console.log("KVNX is not deployed. site/token.json stays unpublished.");
  process.exit(0);
}

console.error("REFUSED: KVNX is a proposed token identity. Refusing to publish a contract address.");
process.exit(1);
