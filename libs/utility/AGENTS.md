# AGENTS.md - @semoss/utility

Inherits the [root guide](../../AGENTS.md) and
[React/TypeScript standard](../../skills/react-standard.skill.md).

## Ownership and organization

This source-only package owns reusable, framework-independent functions. Keep one
flat file per functional category in `src/`; the [README](./README.md) lists the
public category imports. Do not add React, SDK, shared, UI, or application dependencies.
Day.js is the existing date dependency; native Date/Intl helpers retain their contracts.

Before adding a helper, search utility files and embedded functions, callbacks, and
repeated expressions in consumers. Compare behavior, not just names or syntax.
Extract equivalent calculations; keep feature validation, palettes, presentation,
transport, and orchestration with their owners. Prefer a native operation such as
object spread to a new wrapper. Do not introduce configurable frameworks to merge
functions with different behavior.

Preserve whitespace, null/undefined fallbacks, errors, timezone interpretation,
rounding, and filename rules. `isRecord` excludes null and arrays but accepts class
instances; it is not a plain-object validator. `copy` preserves Dates and is not a
replacement for JSON serialization or `structuredClone`. `readNonEmptyString`
checks trimmed content but returns the original string. Strict Base64 decoding
throws; the legacy shared asset adapter retains its nullable/error-logging behavior.

## Exports and browser behavior

Consumers import from `@semoss/utility/<category>`; internal imports target defining
files. Keep the root and legacy `string`, `markdown`, `json`, and `file-extension`
exports compatible. Compatibility modules re-export implementations rather than
copying them. Add supported subpaths to `package.json` when adding a category.

Access browser globals only inside called functions. Applications own notifications.
Downloads must release temporary anchors and object URLs on both success and failure.
Do not replace the lifetime management of preview URLs with the download helper.
Do not import helpers into functions serialized for execution in another page.

## Validation

Use focused Vitest tests for shared contracts and compatibility exports. Browser
tests opt into jsdom; the default environment stays Node to catch import-time DOM
access. Run `pnpm --filter @semoss/utility test`,
`pnpm --filter @semoss/utility exec tsc --noEmit`, and focused Biome checks.
Run date tests with both `TZ=UTC` and `TZ=America/New_York`. Check affected consumers
after moving exports. There is no utility build script: hosts compile its source.
