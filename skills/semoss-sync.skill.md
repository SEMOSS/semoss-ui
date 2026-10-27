---
name: semoss-sync
description: "Generate selected @semoss/sdk TypeScript REST and Pixel contracts from SEMOSS and Monolith annotations. Covers backend selection, deterministic generation, policies, drift checks, and validation."
---

# SEMOSS SDK contract generation

Read [the SDK guide](../libs/sdk/AGENTS.md),
[the API guide](../libs/sdk/src/api/AGENTS.md), and
[the generator guide](../src/script/README.md). React work also requires reading
the full [React standard](./react-standard.skill.md).

## Authority and scope

Backend `prerna.contract` annotations and JAX-RS metadata drive the generated
TypeScript. The initial selection is `HealthResource.readiness` and
`StopPixelExecutionReactor`. Only `@semoss/sdk` TypeScript is generated.

The previous manually curated REST and reactor catalogs and manual audit state
have been removed. `semoss-sync.json` now records the last successful live sync
time and contract snapshot hash automatically. Do not recreate parallel payload types or infer a
complete SDK catalog from method bodies. Existing root helpers, stores, hooks,
`useAPI`, `buildPixel`, and shared transport remain supported.

## Workflow

1. Inspect the selected backend operation and its annotations. Follow the backend
   guide at `Semoss/docs/development_guides/operation_contracts.md`. Fix metadata
   there rather than overriding generated descriptions/types in the UI.
2. Add an operation to `src/script/sdk-operations.json` only when its contract and
   registration fit a supported adapter. The selection contains Java identifiers,
   not hand-maintained wire schemas. It is deliberately not catalog discovery.
3. Compile backend dependencies against the matching SEMOSS artifact, then run
   `pnpm --filter @semoss/sdk generate --semoss <path> --monolith <path>`.
   The exporter compiles selected sources into a temporary directory and reads
   contracts without constructing or executing operations.
4. Review `libs/sdk/contracts/operations.json`, the generated-file manifest, and
   generated TypeScript. Preserve statuses, optional/null distinctions, aliases,
   invocation order and omission, policy reasons, descriptions, and diagnostics.
   `@Ignore` removes SDK inclusion; internal and deprecated remain independent.
5. Add a focused fixture test for any new binding/type adapter. Unsupported or
   unresolved contracts must fail generation instead of guessing. Update curated
   package exports/build entries when adding a resource group.
6. Run live `generate:check`, generator fixtures, SDK type checking, source tests,
   and build integration tests. Run Biome on changed files. The snapshot-only
   `generate:check --from-contracts` must also work without backend checkouts.

Do not edit generated files manually. Commit the contract snapshot and generated
TypeScript together with `semoss-sync.json`. Only successful live generation updates
that record; failed runs, checks, and snapshot replay preserve it. Generated-file cleanup must only remove manifest-owned paths
with the generator's header. Keep backend discovery, broad migrations, and changes
to existing helper runtime behavior outside an examples-only request.

## Validation

```sh
pnpm --filter @semoss/sdk generate:check --from-contracts
pnpm --filter @semoss/sdk test:generator
pnpm exec tsc -p src/script/tsconfig.json
pnpm --filter @semoss/sdk exec tsc --noEmit -p .
pnpm --filter @semoss/sdk test
pnpm --filter @semoss/sdk test:integration
```

Only a live generation/check verifies source agreement with the selected backend
checkout. Mocked transport tests and TypeScript builds do not prove deployed server
behavior. Report the distinction and any unsupported adapters in the handoff.
