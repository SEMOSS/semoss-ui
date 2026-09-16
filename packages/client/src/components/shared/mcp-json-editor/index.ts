// DUPLICATE — the canonical copy of this editor lives in `@semoss/panels`,
// which is what the MCP file panel renders. This copy exists only for the
// legacy BLOCKS workspace (`blocks-workspace.tsx`) and `app-file-editor.tsx`,
// and is deleted when BLOCKS migrates off FlexLayout.
//
// Do not "fix" the duplication by re-pointing the panel here: that would make
// @semoss/panels depend on the client, which is the direction this move
// exists to reverse. Fix a bug in both, or only in the package if BLOCKS does
// not hit it.

export { MCPJsonEditor } from "./mcp-json-editor";
export {
	type LoadedMCPFile,
	readMCPFile,
	toFileText,
} from "./mcp-json-utils";
export { MetadataHelpDialog } from "./metadata-help-dialog";
export type { MCPJsonData } from "./types";
