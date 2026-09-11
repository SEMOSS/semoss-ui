// The package's public file-panel surface. Deliberately curated rather than
// `export * from "./…"`: of the sixty symbols this folder used to leak, eight
// had a consumer outside the package. The rest — every panel blueprint (hosts
// register through `FILE_PANEL_COMPONENTS`), every chrome control, every
// pixel-builder and every panel's config type — are how a panel is built, not
// what a host mounts.
//
// It also stopped a real collision: `export *` put `getImageMimeType(path)`
// next to `@semoss/shared`'s incompatible `getImageMimeType(extension)` in any
// barrel that re-exported both.
//
// Add to this list when a consumer genuinely needs a symbol, not before.

/* Picking the panel for a path, and reading a file panel's published value */
export { getCodeEditorLanguage, getFilePanelType } from "./file-editor.utility";
/* The explorer body a host builds its own explorer panel from */
export { FileExplorerPane } from "./file-explorer-pane";
/* The blueprint map a host registers */
export { FILE_PANEL_COMPONENTS } from "./file-panel.components";
/* Which panel types exist, and what counts as one at runtime */
export {
	FILE_PANEL_TYPES,
	isFilePanelType,
	MCP,
} from "./file-panel.constants";
/* The scope a file panel is opened in */
export type { FilePanelMode } from "./file-panel.mode";
export type { FilePanelValue } from "./use-file-panel";
