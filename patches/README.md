# Office viewer Save integration

These version-pinned pnpm patches let SEMOSS persist native Save commands using
the same file lifecycle as the panel Save control. `pnpm install --frozen-lockfile`
applies them; do not edit installed packages by hand.

- `ooxml-ui@1.21.0.patch`: Visio's File and quick-access Save dispatch a cancellable
  `file-command` event before the package's default copy download. The patched
  element also exposes `commitTextEdit()` so host Save can await the current
  inline text draft before exporting; refused edits return false after reporting
  their draft for recovery. A plain-text edit rejected as unsupported is retried
  through the range editor, which preserves native formatting markers and keeps
  field/protection/formula validation. Other failures are never retried.
- `pptx-react-viewer@4.45.0.patch`: native PPTX Save dispatches the same event from
  the mounted canvas, for ESM and CommonJS entry points. A cancelled command skips
  both the download and the viewer's success feedback/recovery acknowledgement.

The event has `{ command: "save" }` detail and bubbles across component boundaries.
`useOfficeFileCommands` cancels it and invokes guarded SEMOSS persistence. An
embedding host that does not cancel the event retains the package's original
download behavior. Explicit exports to other formats retain their original path.

Visio's `visio-text-edit` event reports applied/refused drafts with source
generation, page/shape IDs and text. The panel retains refused drafts in a
copyable notice until corrected, dismissed or another file is loaded. This does
not enable dynamic ShapeSheet edits or suppress core dependency checks.

Keep these patches until upstream offers an equivalent supported Save override.
After checking out changes to a patch, install dependencies before rebuilding:
`pnpm install --frozen-lockfile`. Running a build alone does not apply patches.
On dependency upgrades, review every Save entry point, including File menus,
quick-access controls, mobile controls and keyboard shortcuts, and verify that
failed host saves preserve edits and do not download a replacement copy.

XLSX read-only recommendation and modify-password behavior is implemented in
`libs/panels`, using the viewer's public workbook model and password verifiers.
Supported hashes require a correct password. Unsupported hashes open read-only
with explicit notice that Enable Editing bypasses password verification, as the
chosen recommendation fallback. Original file-sharing metadata is preserved.
SEMOSS resource permissions always remain the upper limit on editing and saving.
