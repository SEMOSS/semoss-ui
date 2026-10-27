# SDK REST resources

Inherits [the SDK guide](../../AGENTS.md) and repository standards. Read
[the generator guide](../../../../src/script/README.md) and
[the sync skill](../../../../skills/semoss-sync.skill.md) for generated contracts.
These resources are framework independent; React work still requires the full
React standard.

## Ownership

- `health/health.ts` is generated from Monolith's annotated readiness operation
  and published as `@semoss/sdk/api/health`. Do not edit it by hand.
- Top-level files retain existing root helper APIs. They are not generated and
  are not deprecated merely because generation exists. Preserve their behavior,
  validation, normalized results, authentication, and lifecycle contracts.
- `src/script/sdk-operations.json` selects operations. Descriptions, types,
  bindings, responses, and policies come from backend annotations/JAX-RS.
  `contracts/operations.json` stores the snapshot. The root `semoss-sync.json`
  records the last successful live generation time and snapshot hash. The prior
  manual route/reactor catalog and audit state have been replaced.
- Only readiness is generated initially. New resource groups need a package
  export and Vite build entry in addition to a backend selection and supported
  adapter. Keep curated public entries and avoid per-folder barrels.
- Common `ApiError`, `UnauthorizedError`, and `RequestOptions` are exported from
  `src/lib/api.ts` as `@semoss/sdk/api`. Their defining files remain in `lib/`.

## Transport and contracts

Generated endpoints use `utility/http.ts`, which shares the existing Env sender,
authentication, CSRF and session state. Keep utilities private. Import defining
files with relative paths; resources must not import stores, React, or the SDK root.
Route-only imports must retain Env initialization without root listeners.

Signatures are `(params, options?)`; optional-only inputs default to `{}`.
`RequestOptions` contains `signal` and `headers`. Non-2xx responses throw `ApiError`
with an unvalidated body. Preserve every declared response status in the generated
response map; a declared error response must not become a successful return.

Use backend wire names unchanged. Optional properties and nullable values are
distinct. Do not infer narrower enum/boolean correlations from descriptions.
Reader diagnostics or unsupported bindings stop generation. See the generator
guide for supported adapters and the rules for extending them.

## Validation

Run generator fixtures, snapshot and live drift checks as appropriate, SDK source
tests, `tsc --noEmit`, and `pnpm --filter @semoss/sdk test:integration` under Node 24.
Run Biome on changed files. Ordinary SDK builds/tests and snapshot replay must not
require Java, Maven, backend checkouts, or a running server.
