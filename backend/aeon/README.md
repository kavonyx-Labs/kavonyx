# Kavonyx Pack

An [Aeon](https://www.aeon.fun) skill pack that reads a Kavonyx vault on BNB Smart Chain (chain ID 56).

Install the pack from the `backend/aeon/` directory of this repository. No domain or social handle is claimed.

| Skill | What it does | Secrets | Capabilities | Default schedule |
|---|---|---|---|---|
| `vauban-vault` | Reports the sheet a vault enforces on its agent: allowlist, caps left this hour and UTC day, moves held at the gate, freeze and revision. `watch:0xVAULT` reports only what changed since the last run. `rule:0xVAULT 0xTARGET` dry-runs one call and says pass, hold or refused, and at which rampart. | none | `read_only`, `sends_notifications` | `0 */6 * * *`, disabled until you enable it |

The vault holds an agent's funds and checks every call against four ramparts: spend caps, an allowlist, a time-lock and an owner freeze. This pack only reads that vault. It never signs, never broadcasts and never asks for a key.

It reads `https://bsc.publicnode.com` and checks the bytecode at the address against the pinned build hash in `skills/vauban-vault/vault.mjs` before trusting it.

## Status

The contract passes its own test suite and is **not audited**. It is not deployed on BNB Smart Chain, and there is no reference vault to query. KVNX is a proposed symbol and is not a deployed token.

Any address whose code does not match the pinned hash is reported as not a Kavonyx vault.

## Verify

```bash
node --test aeon/test/vault.test.mjs
```

No network and no dependency beyond Node.js.
