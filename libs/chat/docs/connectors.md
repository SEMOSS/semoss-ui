# Connectors

> Part of the [chat guide](../AGENTS.md). Microsoft 365 and Google Workspace in a chat: whose the tools are, how a room copies them, and how sign in is read. Read it before changing `features/connectors/`.

`features/connectors/` connects Microsoft 365 and Google Workspace.
`RoomStore.connectors` (`ConnectorsStore`) owns the services switched on and the accounts they
sign in with, per room. The Connectors page of the user's settings dialog
(`features/connectors/settings/`, shown by `UserSettingsDialog`, which a host opens from its user
menu, or chat UI from Manage Connectors in Settings' Connectors section through
`callbacks.onOpenSettings("connectors")`) connects accounts and switches the
user's apps on or off for all their chats; it is the only place connectors are switched. An app switched on whose
account is not connected shows its switch in gray with a warning mark. These details are easy to break:

- **Connectors are the user's, copied into each room.** The user's connector tools live in their
  own asset folder, `mcp/playground_connector_mcp.json`, written with `MakeUserPixelMCP` and
  stamped `SMSS_MCP_GENERATOR: PlaygroundConnectors`. The settings Connectors page edits that one
  file, so a change reaches all the user's chats, new and existing, and the UI says so. Each room
  holds a copy in its own `mcp/pixel_mcp.json` (`syncRoomConnectorTools`):
  `ConnectorsStore.adopt` makes it before a draft's prepared room sends its first message, `restore` brings it up to
  date whenever a room loads, and the open chat takes a save straight away:
  `writeUserConnectorTools` tells `subscribeUserConnectorTools` listeners, and
  `useUserConnectorsSync` in the room input hands the tools to
  `ConnectorsStore.applyUserConnectorTools`. The copy replaces only the room's connector tools
  (the stamped ones, and legacy ones found by reactor) and keeps every other tool. A user with no
  file yet has chosen nothing, so their rooms keep the connectors they have; only a file that is
  missing counts as empty, never a read that failed. The first sign in to a provider on the
  settings page switches on every app its sign in covers (`enableServices`, only once the file
  has been read, so it never overwrites choices it has not seen); reconnecting leaves the user's
  choices alone. An app's switch works before its account is connected: switching it on signs
  in from the click and then switches on that app alone, and the switch goes back off when the
  sign in does not finish. A provider the server does not offer stays grayed out, its Sign In
  and its switches disabled. The catalog and each tool's approval policy live in
  `connector-catalog.ts`; sending, deleting, sharing, and invites always ask. Outlook and Gmail
  offer the same mail operations, and the two calendars the same calendar operations
  (`MAIL_OPERATIONS`, `CALENDAR_OPERATIONS`, each named by its reactor prefix). Those reactors
  declare their own view (`declaresView`), so their tools are written with only
  `SMSS_MCP_EXECUTION` and keep the `SMSS_MCP_UI` the backend gives them; every other tool is
  written with an inline view when it asks and a Workspace view when it does not.
- **The connector viewers come from `@semoss/connectors`.** OneDrive, Teams channels, files, and
  chats, Google Drive and Docs, and one mailbox and one calendar view for both accounts are its
  viewers (`libs/connectors/`). The room mounts each as a Workspace panel
  (`features/connectors/viewers/connector-viewer-panels.tsx`) with `showHeader={false}`, since its tab already names
  it; the Outlook and Gmail panels both render `MailboxView`, and the two calendar panels
  `CalendarAgendaView`, each with its `provider`. The tab, the Workbench rail, and context chips show the app's logo from the source's `brand`
  (`viewers/connector-sources.ts`); a panel opened with `{ brand }` in its config shows that logo
  instead and gets a tab of its own (`viewers/connector-panel-icon.tsx`), so one viewer can
  stand for more than one app. The room wires each viewer with
  `viewers/use-room-connector-host.ts`: saves land at the top of chat files, and Add to context
  also queues the file in `RoomStore.contextItems`.
- **A viewer shows once its connector is on.** The Workbench rail and the slash menu
  list `ConnectorsStore.availableSources` with the Workspace's panels (the plus menu does not): a viewer needs its connector switched
  on for the chat (`requires` in `viewers/connector-sources.ts`) and its account signed in.
- **A chat says when its connectors cannot run.** Inside the input box, `ConnectorSignInNotice`
  lists every account the chat's switched on connectors need but the session is not signed in to
  (`ConnectorsStore.missingSignIns`, read again whenever the window regains focus), with a Sign In
  button. It also names accounts this server does not offer (`unofferedProviders`) and
  connectors this server's sign in cannot cover (`uncoveredConnectors`). Coverage comes from
  `connectorAccess` in `/api/config`: the server judges it from the scopes each sign in asks for
  (`ConnectorScopeAccess` in Semoss) and sends only whether each app can work, and only to a user
  signed in to the platform, so the scopes never reach the page. `connector-access.ts`
  reads it by each service's `accessKey`, and a service the sign in cannot cover cannot be
  switched on. The session can also list an account whose token has lapsed, so a connector call
  that fails with the login required error offers a sign in in its own card (`isSignInFailure`).
- **The SDK owns the session's logins.** Playground keeps no login state or cache of its own:
  `useLogins()` from `@semoss/sdk/react` reads the SDK's `Session.logins`, shared by the whole page, and
  reads again when a view mounts or the window regains focus. `useConnectorLogins` hands it to
  `ConnectorsStore.setSessionLogins`, and `useConnections` reads it for the Connectors page. Signing
  in goes through `signInToProvider` (`connector-sign-in.ts`), which calls
  `Session.logins.connect`: a fresh sign in that never signs out the session's own login. See
  [the SDK guide](../../libs/sdk/AGENTS.md#session-logins).
- **Connector files are pixel calls, not session state.** `connector-tools.ts` reads the user's
  connector file with the SDK's `readUserAsset`, writes it with the SDK's
  `makeUserPixelMcp`, and keeps each room's copy through `features/room/store/room-tool-file.ts`. It holds
  no login code.
