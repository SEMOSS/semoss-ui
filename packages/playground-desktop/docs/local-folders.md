# Local Folders in @semoss/playground-desktop

> Part of the [desktop guide](../AGENTS.md). How a room attaches folders from this machine, and the rules that keep every file call inside them. Read it before changing `local-folders/` or `local-fs:*` in main or the renderer.

A room can attach folders from this machine. The app gives them to the chat as
[client tools](../../../libs/chat/docs/tools.md#client-tools), all in
`renderer/features/local-folders/`:

- `desktop-folders-host.ts` is the `LocalFoldersHost` (`local-folders-host.ts`) over the
  `local-folders:*` and `local-fs:*` channels.
- `desktop-tools-host.ts` (`createDesktopToolsHost`) is the chat's `ToolsHost`, made once per
  window in `AppLayout`, which hands it to the chat's config and to `DesktopToolsContext`, where
  `useDesktopTools` reads it. It keeps a `RoomLocalFoldersStore` per room the chat has
  open, offers the `desktop_*` tools over the room's folders (`DesktopFolders`, each folder a
  top level entry, with the chat's `describeFolderTool` and `executeFolderTool`; each has its own
  `desktop_folder_*` setting, never the Room Files one, so reads run at once and every change asks
  until the user says otherwise), and detaches a new chat's folders when it is left before its
  first message.
- In Files, the room's folders are one root, Desktop (`DesktopFileRoots` in the chat's
  `WorkbenchFileRoots` slot, `DesktopRoot`): one explorer over `createDesktopFilesSource`, which
  lists each folder as a top level directory (mount `desktop`). Its row's menu and its empty state
  attach a folder (`usePickFolder`); each folder's row carries Show in Finder and Detach, and its
  files Open with Default App (`desktop-host-files.tsx`).
- Attach Folder in the plus menu (`AttachFolderItem`) and "/" (`AttachFolderCommand`) attach
  to an open room, or to the room a new chat prepares (`useComposer().prepareRoom()`). An open
  room then shows its Files.
- **Search runs off the main thread.** `local-fs:search` walks the folder in a `worker_threads`
  worker (`search-folder.worker.ts`, imported with electron-vite's `?nodeWorker`), one per folder
  at a time: a newer search stops the older one. It finds what the listing shows (hidden names
  skipped), does not walk through links to folders, and stops at `MAX_FOLDER_SEARCH_RESULTS` (500)
  or 10 seconds, saying so (`isTruncated`), which Desktop shows under its results.
- Its strings are in the `desktop` namespace, under `localFolders`.

- **Only the system's folder picker attaches a folder** (`local-folders:pick`, parented to the
  window). The page never sends a path on the machine: a file call names `{ roomId, folderId }`
  and a path inside the folder, for the server in use.
- **Every path stays inside its folder** (`resolveInsideFolder`): leading slashes are dropped,
  `..` and other drives are refused, symbolic links are followed as far as the path exists and
  refused when they lead out or into a hidden entry, and `.git` is hidden and refused, in any
  case and with Windows' trailing dots and spaces (`isHiddenName`). The folder itself is never
  written, moved or deleted. Reads stop at 50 MB.
- **Deleting moves to the trash** (`shell.trashItem`). Open and Show in Finder go through
  `shell.openPath` and `shell.showItemInFolder`. Opening anything that would run (an app, a
  script, an installer, a shortcut, an executable file: `isRunnable`) asks the user first, in a
  dialog main shows.
- **Watching** (`local-folders:watch`, counted, one `unwatch` each) sends
  `local-folders-changed` `DesktopCommand`s, gathered for 200 ms. Switching or removing a server
  closes its watchers.
