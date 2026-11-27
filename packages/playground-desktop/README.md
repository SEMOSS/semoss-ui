# @semoss/playground-desktop

The SEMOSS chat as a desktop app named **Playground** (Electron). It ships the chat's UI and
signs in to hosted SEMOSS servers: you add a server on first launch, and can save more, each
with its own sign in. Its screens are built from [`@semoss/chat`](../../libs/chat/README.md), the
same library the web app ([`@semoss/playground`](../playground/README.md)) uses, so rooms made in
one show up in the other.

## What you need

- Node.js 26 and pnpm 12 (see the repository's `.nvmrc` and root `package.json`)
- The address of a SEMOSS server you can sign in to, such as
  `https://semoss.example.com/Monolith`. It must be `https`, or `http` on this machine only.

## Run it

From the repository root:

```bash
pnpm install
```

```bash
pnpm dev:playground-desktop
```

That builds the libraries the app depends on and opens the app with hot reload. On first launch
it asks for your server's address, checks it, and takes you to sign in.

To run only this package once its dependencies are built, from `packages/playground-desktop`:

```bash
pnpm dev
```

## Using it

- **Servers.** The account menu at the foot of the sidebar opens **Settings**; its **Servers**
  page lists your saved servers. **Activate** opens the app on another one (no new sign in
  needed), the trash button removes one and signs you out of it, and the form adds one.
  **File > Change Server…** opens the same list as a page, which is also what you see when
  signed out or when the server cannot be reached.
- **Connectors.** Settings > Connectors signs in to Microsoft 365 and Google Workspace and
  switches their apps on for your chats.
- **Folders on this machine.** In a room, the Files panel's Desktop section (or the composer's
  plus menu) attaches a folder, which the chat can then read and change. Deleting moves files to
  the trash.

## Commands

Run from `packages/playground-desktop`, or with `pnpm --filter @semoss/playground-desktop <command>`:

| Command | What it does |
|---|---|
| `pnpm dev` | Run the app with hot reload (renderer on `127.0.0.1:5181`) |
| `pnpm build` | Build the main process, preload, and renderer into `out/` |
| `pnpm preview` | Run the built app |
| `pnpm package` | Build, then make an unpacked app in `release/` |
| `pnpm dist` | Build, then make installers (dmg/zip, NSIS, AppImage) |
| `pnpm test` | Run the tests |
| `pnpm type-check` | Type-check the renderer, then main, preload and contract |

Renderer tests use jsdom, declared directly and kept aligned with chat and the web app.
Main-process and contract tests opt into Vitest's Node environment per file.

Builds are unsigned unless the signing variables are set; see
[AGENTS.md](./AGENTS.md#not-here-yet).

## Where its data lives

Everything the app saves is in Electron's `userData` folder, shared by `pnpm dev` and the
packaged app:

| OS | Folder |
|---|---|
| macOS | `~/Library/Application Support/Playground` |
| Windows | `%APPDATA%\Playground` |
| Linux | `~/.config/Playground` |

It holds the saved servers and window size (`smss-desktop-config.json`), the folders attached to
rooms (`smss-desktop-folders.json`), and each server's cookies and storage. No passwords are
stored. Delete the folder to start over.

## How it is put together

```
src/
  contract/   types and pure functions every process shares (the IPC channels, server addresses)
  main/       the Electron main process: the window, the local proxy to the server, folders, menu
  preload/    the bridge the page calls main through
  renderer/   the React app: pages/ and features/, composing @semoss/chat
```

The main process runs a small local server that serves the app and forwards the server's module
path, so the page talks to SEMOSS on its own origin, as the web app does.

[AGENTS.md](./AGENTS.md) has the detail: how sign in and cookies work, the security rules, how to
add an IPC channel, and releasing a build.
