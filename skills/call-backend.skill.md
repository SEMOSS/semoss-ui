---
name: call-backend
description: "Use when reading or writing backend data from a feature, adding an api/ module or pixel call, or adding a new API to @semoss/sdk. Covers SDK primitives, usePixel, CSRF, response mapping, and error surfacing."
---

# Call the Backend

## When to Use

When a feature needs data from or changes to the server, or when a new SDK API is needed. For
rooms, chat, agent runs, or session work, start from [libs/sdk/AGENTS.md](../libs/sdk/AGENTS.md),
which routes to the SDK's own guides.

## Read First

- [libs/sdk/AGENTS.md](../libs/sdk/AGENTS.md)
- [general.md: Boundaries](../docs/standards/general.md#boundaries-and-errors) and the
  [data access rules](../docs/standards/react.md#data-access)

## Steps

1. **Search first.** Check `@semoss/sdk` (core and `@semoss/sdk/react`) and the app's `api/`
   folder for an existing call. Sign in, sign out, registration, uploads, downloads, logout, and
   bulk permission changes already exist in the SDK, so never wrap them again in an app.
2. **Reads in React.** Use an existing SDK hook or
   [`usePixel`](../libs/sdk/src/js-frameworks/react/hooks/use-pixel.ts).
3. **App-specific requests** go in the app's `api/<domain>.ts` (or `<prefix>-<what>.api.ts` in the
   feature), built on `get`, `post`, and `runPixel` from `@semoss/sdk`. Never use raw `fetch`. If
   `fetch` is unavoidable, spread `await getCsrfHeaders()` into its headers.
4. **Map at the edge.** Parse and validate the payload, then return model types. Pixel strings
   and response shapes never reach components.
5. **Surface failure.** Throw or return an explicit error when the call fails or required data is
   missing. Never report success for a failed operation. Read the reactor's warnings with
   `readPixelMessages` where the action returns them.
6. **Ordering and concurrency.** Run independent reads together. Keep Pixel and insight mutations
   in order. Handle cancellation and stale results in the hook that calls the API.
7. **Adding to the SDK.** Framework-agnostic code goes outside `js-frameworks/`. React-only code
   goes under `js-frameworks/react`. Export from `src/index.ts` or the React entry. Inspect the
   owning implementation and its neighboring tests. If the change touches rooms, chat, or session,
   update the SDK's packaged guide, as `libs/sdk/AGENTS.md` describes.

## Checklist

- [ ] No raw `fetch` without CSRF headers, and no duplicate of an existing SDK API
- [ ] Response is validated and mapped in `api/`
- [ ] Errors and missing data are surfaced, not swallowed
- [ ] Mutation order and cancellation are preserved
- [ ] Mocked tests are not presented as proof the backend works

## Verify

```bash
pnpm --filter <package> test
pnpm --filter @semoss/sdk test && pnpm --filter @semoss/sdk build   # when the SDK changed
```
