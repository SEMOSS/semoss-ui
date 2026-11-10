---
name: sdk-session
description: "Use when signing users in or out, reading the signed in user or their metadata, gating UI on sign in or retrying a session that could not be read, reading the server config or theme, checking a user's permission on a project or engine, or deciding which insight a pixel runs in with @semoss/sdk. Covers Session, Config, useSession, useSessionRetry, useConfig, useSessionPermissions, useSessionInsight and useLogins."
---

# @semoss/sdk Session, Config and Permissions

This guide ships with the SDK and describes this package's implementation. Import
the stores from `@semoss/sdk` and the hooks from `@semoss/sdk/react`.

## Which store owns what

| Store | Owns | React |
|---|---|---|
| `Session` | The signed in user: sign in and out, who they are, their metadata, permissions, logins, and one insight of its own (`Session.insight`) | `useSession(selector)`, `useSessionPermissions(type, id)`, `useSessionInsight()`, `useLogins()` |
| `Config` | The server's metadata: theme, version, flags, meta keys, sign in providers. Needs no session | `useConfig(selector)` |
| `Insight` | A workspace the user works in: a workbench, room, terminal tab or notebook | `<InsightProvider>`, `useInsight()` |

Put an `<InsightProvider>` only around a workspace. Do not use one as the app's sign in
gate or as the source of the user: that is `Session`.

## Start and gate

Call `Session.initialize()` once from the app's entry point, after any embed
authentication. It reads the config, then the user when there is a session. It
never rejects: a failure shows as the `ERROR` status, and the next call reads again.

```ts
import { Session } from "@semoss/sdk";

await waitForEmbedAuth(); // when the app can be embedded
void Session.initialize();
```

```tsx
import { useSession } from "@semoss/sdk/react";

const AuthenticatedLayout = () => {
    const status = useSession((state) => state.status);
    const { isRetrying, retry } = useSessionRetry();
    if (status === "INITIALIZING") return <Spinner />;
    if (status === "ERROR") return <ErrorPage onRetry={retry} isRetrying={isRetrying} />;
    if (status !== "AUTHENTICATED") return <Navigate to="/login" />;
    return <Outlet />;
};
```

The hooks need no provider; they read the page's `Session`. A `<SessionProvider>`
only swaps in another session, as tests do with `new SessionStore({ config: new ConfigStore() })`.
Selectors may build plain records or arrays; shallowly equal selections stay stable.
Errors and other non-plain objects compare by identity.

Components under a provider must select their `login`, `requestOTP`, and `refresh`
actions from `useSession` as well, for example `useSession((state) => state.login)`.
Calling the global `Session` would mutate a different session from the one whose
state the component reads. With no provider, the hooks keep using the global session.

## Snapshot

`useSession((state) => ...)` and `Session.getSnapshot()` return:

| Field | Value |
|---|---|
| `status` | `"INITIALIZING"`, `"UNAUTHENTICATED"`, `"AUTHENTICATED"` or `"ERROR"` |
| `user` | `null` when signed out, else `{ id, name, username, email, provider, isAdmin, isNative, userEpoch, lastLogin?, groupInfo?, meta, defaultModels: { textGeneration, codeGeneration } }` |
| `error` | Why the session could not be read, else `null` |
| `isChecking` | Whether the session is being read: the first check, a `refresh`, or the read after a sign in. `status` keeps its last value meanwhile, so `ERROR` stays `ERROR` while a retry runs |

`useSessionRetry()` returns `{ isRetrying, retry }`: `isChecking` and `refresh`, for a Retry
on `ERROR`. It reads the session, so every view agrees while a retry runs.

The user is read in one request from two pixels, which return different things:

- `GetUserInfo`: who the user is on each login (id, name, email, epoch, groups),
  with the metadata their login token loaded at sign in. The token copy is only
  reloaded after the user's own `SetUserMetadata`.
- `GetUserMetadata`: the primary login's metadata, read from the database each time,
  so it includes an admin's changes and those made through another server.

`user` describes the config's `primaryLogin`, then SAML, then NATIVE, then the first
login. `user.meta` comes from `GetUserMetadata`, or from that login's token copy when
the database read fails. It is kept as the backend keeps it, each key a list of text
values in order (`{ "text-generation-model": ["engine-id"] }`). `user.defaultModels`
reads the two default model keys from it. `Session.reloadUser()` reads the
user again, such as when another app may have changed their default model, without
touching the config, logins or permissions. `Session.refresh()` starts the whole
session over, config included.

## Actions

| Action | Notes |
|---|---|
| `login({ type: "native" \| "ldap", username, password })` | Resolves to whether a user is signed in; throws when refused. Reads the new session, config included |
| `login({ type: "oauth", provider })` | Opens a popup, so call it straight from a click |
| `requestOTP(username, pin)` then `login({ type: "linotp", otp })` | `requestOTP` resolves false when the password must change first |
| `register({ name, username, email, password, phone, phoneextension, countrycode })` | Creates a native account; does not sign in |
| `logout()` | Forgets the user, their logins and permissions; throws when refused |
| `setMetadata(meta)` | Sets the user's metadata, such as `{ "text-generation-model": engineId }`. Only the keys given change; an empty value or list removes a key. Shows the change at once, reverts when the backend refuses it, then reads the user again, since the backend does not report every failed write. Each key must be one of the server's user meta keys, which admins manage |
| `canPerform(resource, operation)` | True for an admin, or when the config does not keep the operation for admins |

## Where a pixel runs

| The pixel | Run it with |
|---|---|
| Needs no workspace and runs once, such as a one off mutation | `runPixel(pixel)` with no insight id. The backend makes an insight for it and keeps it until the session ends |
| Needs no workspace and runs again and again, such as a search, a list that pages, or a poll | `useSessionPixel(pixel)` waits for the session's existing insight ID, or `Session.insight.run` / `useSessionInsight().run` when creation and recovery are needed. Never `runPixel` with no id, which would keep one more insight each time |
| Belongs to a workspace | `useInsightPixel(pixel)` uses only the nearest `<InsightProvider>` and waits for its ID; it throws without a provider. Alternatively, use that workspace's `useInsight().actions.run` or its `insightId` |
| Is one of several steps that must share an insight but belong to no workspace, such as an upload then a pixel reading the file, or an export then its download | `Session.insight`: `upload`, `run`, `download`, or `useSessionInsight()` in React |

`Session.insight` (a `SessionInsightStore`) is the session's own insight. It is not a
workspace: it has no recipe, room or state, only an id that every call shares.

`useSessionPixel(pixel, config?)` subscribes to that ID and stays `INITIAL` while it
is empty. It does not initialize the session or create the insight: the host must
call `Session.initialize()` (or use `useSession`) to supply it. It ignores workspace
context and calls `runPixel` directly, without missing-insight recovery.
`useInsightPixel(pixel, config?)` likewise never runs with an empty workspace ID.
Both expose the same state, callbacks, `refresh` and `update` as `usePixel`.
An empty pixel also leaves them `INITIAL`; losing an ID cancels stale results.

Existing `usePixel(pixel, config?, insightId?)` callers retain their routing:
explicit ID, otherwise the nearest workspace ID, with no session fallback.
Only implicit context fallback is deprecated; all call signatures remain valid.
Use `useInsightPixel` for context-based reads or `useSessionPixel` for session reads.
An explicit empty ID bypasses context. An empty ID, or no ID outside a workspace,
lets the backend create an insight without retaining it in the session.

| Member | Notes |
|---|---|
| `run(pixel)`, `runAsync(pixel)` | Run in the insight. The first `run` makes the insight in the same request |
| `upload(files, projectId?, path?)` | The backend refuses an upload without an existing insight, so one is made first |
| `download(fileKey)` | Only for a file the same insight made |
| `withInsight((insightId) => request)` | Any other request that takes an insight id. Before the insight is made it is given `"new"` |
| `ensure()` | Makes the insight now when there is none and resolves to its id. Use it before a long request watched by that id, such as a pixel whose console is read while it runs |
| `getSnapshot().insightId` | Empty until made |

It is made on first use and kept; on `INSIGHT_NOT_FOUND` a new one is made and the call
runs once more. A sign in or out clears it.

`Session.insight.run` returns `{ insightId, errors, pixelReturn }` and does not throw on pixel
errors, unlike `useInsight().actions.run`. Check `errors` before reading
`pixelReturn`, and throw `new Error(errors.join(""))` where the caller expects a throw.
Session pixels should start with `META |` so they stay out of the insight's recipe.

## Config

`useConfig((state) => ...)` returns `{ status, config, theme, error }`, with `status`
`"IDLE"`, `"LOADING"`, `"READY"` or `"ERROR"`. `config` and
`theme` are `null` until the config loads, so give every read a fallback:
`useConfig((state) => state.config?.databaseMetaKeys) ?? []`. `theme` is the server's
`THEME_MAP`, already parsed. `Config.load({ force })` reads again; the session does so
after each sign in and sign out, including when the backend ends the session. If the read
after a sign out fails, the config is reset to `IDLE` rather than kept naming the old
user's logins.

## Permissions

```tsx
const { status, permission, canEdit, isOwner, refresh, sync } =
    useSessionPermissions("PROJECT", projectId); // or "ENGINE", "INSIGHT"
```

Every view asking about the same resource shares one read, and the cache is cleared
when the user changes. Pass `null` as the id when there is nothing to read; the
status is then `IDLE`. Call `refresh()` after changing the user's own access, or
`sync(permission)` when another read already returned it.
`Session.permissions.get(type, id)` reads the cache without subscribing.

## Logins

`useLogins()` returns `{ logins, accountIds, primaryLogin, status, refresh, connect,
disconnect }` for what the session is signed in to, and reads again on mount and on
window focus. `Session.logins` is the same store outside React. `connect(provider)`
opens a sign in popup from a click; neither it nor `disconnect` signs out the
session's own login.

## Insight lifecycle belongs to its owner

The backend associates insights with the authenticated session and drops them when
that session closes. `InsightStore` does not subscribe to `Session`, automatically
reinitialize on sign-in, or broadcast session changes. It reads shared configuration
through `Config`; its local flags change through initialization and its own actions:

```tsx
const { isInitialized, isAuthorized, isReady } = useInsight();
```

Use `useSession` for page-level session state and an `InsightProvider` for each
workspace. The insight's local authorization flag is not a reactive session mirror.

`InsightProvider` destroys its insight on cleanup by default. Set
`destroyOnUnmount={false}` when a room or terminal owns that backend workspace.
Outside React, call `initialize()` and `destroy()` explicitly. Concurrent
initialization calls share one setup, and a later call reinitializes the instance.
There is no separate `dispose()` method, lifecycle generation tracking, or frontend
session-subscription cleanup.

These still work but are deprecated, because their data has one home:

| Deprecated | Use |
|---|---|
| `system.config.x` | `useConfig((state) => state.config?.x)` |
| `actions.login(...)`, `actions.logout()` | `Session.login(...)`, `Session.logout()`; a sign in or out is for the whole page |
| `actions.requestOTP(...)` | `Session.requestOTP(...)` |
| The default model members | `useSession((state) => state.user?.defaultModels)` and `Session.setMetadata` |

The insight's own auth actions update that insight and its config/logins; they do
not refresh or notify the frontend `Session` store.
