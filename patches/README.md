# Office viewer Save integration

These version-pinned pnpm patches let SEMOSS persist native Save commands using
the same file lifecycle as the panel Save control. `pnpm install --frozen-lockfile`
applies them; do not edit installed packages by hand.

- `ooxml-ui@1.21.0.patch`: Visio's File and quick-access Save dispatch a cancellable
  `file-command` event before the package's default copy download.
- `pptx-react-viewer@4.45.0.patch`: native PPTX Save dispatches the same event from
  the mounted canvas, for ESM and CommonJS entry points. A cancelled command skips
  both the download and the viewer's success feedback/recovery acknowledgement.

The event has `{ command: "save" }` detail and bubbles across component boundaries.
`useOfficeFileCommands` cancels it and invokes guarded SEMOSS persistence. An
embedding host that does not cancel the event retains the package's original
download behavior. Explicit exports to other formats retain their original path.

Keep these patches until upstream offers an equivalent supported Save override.
On dependency upgrades, review every Save entry point, including File menus,
quick-access controls, mobile controls and keyboard shortcuts, and verify that
failed host saves preserve edits and do not download a replacement copy.

XLSX read-only recommendation and modify-password behavior is implemented in
`libs/panels`, using the viewer's public workbook model and password verifiers.
Supported hashes require a correct password. Unsupported hashes open read-only
with explicit notice that Enable Editing bypasses password verification, as the
chosen recommendation fallback. Original file-sharing metadata is preserved.
SEMOSS resource permissions always remain the upper limit on editing and saving.
