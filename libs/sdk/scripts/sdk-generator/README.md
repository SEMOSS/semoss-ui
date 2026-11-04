# SDK generator

Generates `@semoss/sdk`'s REST calls and typed Pixel catalog from the OpenAPI 3.1
document the backend writes. The backend owns the contract and each SDK consumes it:
this generator for TypeScript, and later a Python generator reading the same document.

```
Semoss reactors (AbstractReactor2)  ┐
Monolith resources (@Operation)     ┴─► Monolith scripts/generate-api ─► target/generator/openapi.json
                                                                                  │ (read, not copied)
libs/sdk: pnpm generate --openapi <that file> ◄───────────────────────────────────┘
  └─► src/generated/api/**.ts, src/generated/pixel/catalog.ts, manifest.json
```

The document is not committed here; pass its path each time. What it generates under
`src/generated/` is committed. Do not edit those files by hand: change the backend,
regenerate, and commit.

## Everything an SDK needs is in the document

Nothing language-specific is decided here that another SDK would have to repeat:

| What | Where in the document |
|---|---|
| Function names | the standard `operationId` (the last URL segment) |
| Module names | `x-semoss-servlets`, each servlet prefix mapped to its module (`"/api": "monolith"`) |
| Payload types | standard JSON Schema under `components.schemas` |
| Reactors | `x-semoss-pixels` (version 1): each reactor's description and its input and output schema `$ref`s |

## Commands

Run from `libs/sdk` (or with `pnpm --filter @semoss/sdk`):

| Command | What it does |
|---|---|
| `pnpm generate --openapi FILE` | Generates from FILE, writing only what changed |
| `pnpm generate:check --openapi FILE` | Read-only: exits 1 when `src/generated/` does not match FILE |

From the backend, `Monolith/scripts/generate-api --sdk <path to libs/sdk>` writes the
document and runs `pnpm generate --openapi` with it.

`pnpm build` and `pnpm test` never run the generator and do not need the backend.

## Adding an endpoint or a reactor

1. **REST.** Annotate the resource method with swagger-core `@Operation` and
   `@ApiResponse`. The `operationId` must be the last URL segment: `/api/auth/users`
   is `users`, published as `users` from `@semoss/sdk/api/monolith/auth`. The response
   type is a record next to the resource. Declare request bodies and query parameters
   with `@RequestBody` and `@Parameter`, since most resources read them by hand.
2. **Pixel.** Extend `AbstractReactor2<Input, Output>`. The `Input` record declares the
   keys and the return type declares the output.
3. Nothing is listed by hand: whatever is annotated is published. Add swagger-core's
   `@Hidden` to leave an API out of the document and every SDK, or Semoss's
   `@Internal("why")` to publish it tagged as internal.
4. Run `Monolith/scripts/generate-api --sdk …`, then commit both repositories.

## What it generates

- **REST.** One module per URL namespace: the module from `x-semoss-servlets`, then a
  submodule for each middle segment.
  - Each call is a plain `async` function, written like the hand-written calls in
    `src/api/`: it builds its URL with `Env.MODULE` (query inputs through
    `URLSearchParams`), sends it with the SDK's `get` or `post` (form inputs as the body),
    and returns `response.data`.
  - Its signature is `fn(options = {})`, or `fn(input, options = {})` when it has inputs, with
    `input?` when every input is optional. `options` is a `RequestInit` passed to `fetch`,
    such as an `AbortSignal` or headers. The input never has a default, so `fn.length` is 1
    with inputs and 0 without; `useAPI` and `useIteratorApi` rely on that.
  - `x-internal` (from the backend's `@Internal`) adds `@internal` to the TSDoc, followed by
    `x-internal-reason`. Internal reactors get the same tag in `PixelCatalog`.
  - It throws when the response is not 2xx, the way `get` and `post` do. Declared error
    responses are named in its TSDoc.
  - Every type is written inline; a module exports only its calls. Name a type with
    standard TypeScript: `Awaited<ReturnType<typeof config>>` and
    `Parameters<typeof users>[0]`. An enum is a string-literal union.
  - A schema that contains itself cannot be written inline, so it is rejected.
- **Pixel.** `PixelCatalog`, each reactor's input and output types, and `PIXEL_PARAMS`,
  which `buildPixel` in `src/api/pixel.ts` uses to write calls. An unconstrained input is
  `PixelValue`; an unconstrained output is `unknown`.
- **Manifest.** `manifest.json` records:
  - the generator version;
  - a hash of the document (keys sorted, so reformatting it changes nothing);
  - a hash of every generated file.

## Deterministic output

The same document always gives byte-identical files, on any machine. The generator
reads nothing but the document:

- **Its own ordering.** It sorts modules, calls, properties, query inputs, reactors and
  Pixel inputs by name, so the document's key order never matters.
- **No locale.** Names are compared by code unit (`byName` in `order.ts`), never with
  `localeCompare`, whose order depends on the machine's locale.
- **Nothing from the environment.** No timestamps, absolute paths or environment values go
  into any file.
- **One formatter.** Formatting is the repository's pinned Biome with `biome.json`.
- **A versioned generator.** `GENERATOR_VERSION` changes whenever the output does, and
  the manifest records it.

## What it rejects

The generator fails, leaving the output as it was, for:

- Anything it cannot represent faithfully: schema keywords outside its subset (`allOf`,
  `not`, `nullable` and other OpenAPI 3.0 forms), and references to anything but
  `#/components/schemas`.
- Path, header or cookie parameters, and bodies that are not
  `application/x-www-form-urlencoded`.
- Methods other than GET and POST, and 2xx responses without a JSON body, since `get`
  and `post` always read JSON.
- Missing descriptions, missing or mismatched `operationId`s, a path outside
  `x-semoss-servlets`, and name collisions.

Files it no longer writes are deleted only when they are in the last manifest and
still start with the generated header.
