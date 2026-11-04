---
name: sdk-session
description: "Use when signing users in or out, reading the signed in user or their metadata, gating UI on sign in, reading the server config or theme, checking a user's permission on a project or engine, or deciding which insight a pixel runs in with @semoss/sdk. Covers Session, Config, useSession, useConfig, useSessionPermissions and useLogins."
---

# @semoss/sdk Session, Config and Permissions

This guide ships with the SDK and describes this package's implementation. Import
the stores from `@semoss/sdk` and the hooks from `@semoss/sdk/react`.

## Which store owns what

| Store | Owns | React |
|---|---|---|
| `Session` | The signed in user: sign in and out, who they are, their metadata, permissions, logins, and one insight of its own | `useSession(selector)`, `useSessionPermissions(type, id)`, `useLogins()` |
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
    if (status === "INITIALIZING") return <Spinner />;
    if (status === "ERROR") return <ErrorPage />;
    if (status !== "AUTHENTICATED") return <Navigate to="/login" />;
    return <Outlet />;
};
```

The hooks need no provider; they read the page's `Session`. A `<SessionProvider>`
only swaps in another session, as tests do with `new SessionStore({ config: new ConfigStore() })`.
Selectors may return objects; an equal selection does not render again.

## Snapshot

`useSession((state) => ...)` and `Session.getSnapshot()` return:

| Field | Value |
|---|---|
| `status` | `"INITIALIZING"`, `"UNAUTHENTICATED"`, `"AUTHENTICATED"` or `"ERROR"` |
| `user` | `null` when signed out, else `{ id, name, username, email, provider, isAdmin, isNative, userEpoch, lastLogin?, groupInfo?, meta, defaultModels: { textGeneration, codeGeneration } }` |
| `insightId` | The session's own insight, empty until made |
| `error` | Why the session could not be read, else `null` |

The user is read in one request from two pixels, which return different things:

- `GetUserInfo`: who the user is on each login (id, name, email, epoch, groups),
  with the metadata their login token loaded at sign in. The token copy is only
  reloaded after the user's own `SetUserMetadata`.
- `GetUserMetadata`: the primary login's metadata, read from the database each time,
  so it includes an admin's changes and those made through another server.

`user` describes the config's `primaryLogin`, then SAML, then NATIVE, then the first
login. `user.meta` and `user.defaultModels` come from `GetUserMetadata`, or from that
login's token copy when the database read fails. `Session.reloadUser()` reads the
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
| `setDefaultModel(key, engineId)` | Shows the choice at once and reverts when the save fails |
| `canPerform(resource, operation)` | True for an admin, or when the config does not keep the operation for admins |
| `run(pixel)`, `runAsync(pixel)`, `upload(files, projectId?, path?)`, `download(fileKey)` | Run in the session's insight; see below |

## Where a pixel runs

| The pixel | Run it with |
|---|---|
| Needs no workspace, such as a catalog read or a one off mutation | `runPixel(pixel)` or `usePixel(pixel)` with no insight id. The backend makes a temporary insight for it |
| Belongs to a workspace | That workspace's `useInsight().actions.run`, `usePixel` inside its `<InsightProvider>`, or its `insightId` |
| Is one of several steps that must share an insight but belong to no workspace, such as an upload then a pixel reading the file, or an export then its download | `Session.upload`, `Session.run`, `Session.download` |

`Session.run` returns `{ insightId, errors, pixelReturn }` and does not throw on pixel
errors, unlike `useInsight().actions.run`. Check `errors` before reading
`pixelReturn`, and throw `new Error(errors.join(""))` where the caller expects a throw.
Session pixels should start with `META |` so they stay out of the insight's recipe.

## Config

`useConfig((state) => ...)` returns `{ status, config, theme, error }`, with `status`
`"IDLE"`, `"LOADING"`, `"READY"` or `"ERROR"`. `config` and
`theme` are `null` until the config loads, so give every read a fallback:
`useConfig((state) => state.config?.databaseMetaKeys) ?? []`. `theme` is the server's
`THEME_MAP`, already parsed. `Config.load({ force })` reads again; the session does so
after each sign in and sign out.

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

## Insights follow the session

An insight reads its config through `Config` and follows `Session`: a sign in
through `Session` sets up an insight that was waiting for one, and a sign out
signs every insight out, as the backend drops them. So `useInsight()`'s
`isInitialized`, `isAuthorized`, `isReady` and `error` stay correct however the
user signed in, and an app with one workspace can keep gating on them:

```tsx
const { isInitialized, isAuthorized, isReady } = useInsight();
```

An app with several workspaces (workbenches, rooms, tabs) gates on `useSession`
instead, and mounts an `InsightProvider` only around each workspace.

These still work but are deprecated, because their data has one home:

| Deprecated | Use |
|---|---|
| `system.config.x` | `useConfig((state) => state.config?.x)` |
| `actions.login(...)`, `actions.logout()` | `Session.login(...)`, `Session.logout()`; a sign in or out is for the whole page |
| `actions.requestOTP(...)` | `Session.requestOTP(...)` |
| The default model members | `useSession((state) => state.user?.defaultModels)` and `Session.setDefaultModel` |

The insight's own `actions.login` and `logout` tell `Session`, so a page that uses
both stays in step.
