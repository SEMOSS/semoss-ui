import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { FILE_PANEL_TYPES } from "../constants/file-panel.constants";
import {
	FILE_CODE_EDITOR_PANEL,
	FILE_MARKDOWN_EDITOR_PANEL,
	FILE_NOTEBOOK_EDITOR_PANEL,
} from "./editors";
import { FILE_EXPLORER_PANEL } from "./explorers";
import { FILE_DOWNLOAD_PANEL } from "./file-download-panel";
import { FILE_MCP_EDITOR_PANEL } from "./mcp/file-mcp-editor-panel";
import {
	FILE_IMAGE_VIEWER_PANEL,
	FILE_PDF_VIEWER_PANEL,
	FILE_PPTX_VIEWER_PANEL,
} from "./viewers";

/**
 * Every file-backed panel, keyed by type. Spread into a domain workbench's
 * `COMPONENTS` map — each one registered the identical nine entries by hand,
 * so a new file panel type had nine places to be forgotten.
 *
 * It also defines what "a file panel" *is* at runtime: `useWorkbenchFilePanels`
 * decides which open panels follow a rename by membership here. Do not gate
 * that on the shape of a panel's config — the Git panels carry the same
 * `{ type, id, name, path }` fields and would be swept up with the file ones.
 *
 * Module scope matters: blueprint identity churn remounts panels.
 */
export const FILE_PANEL_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[FILE_PANEL_TYPES.FILE_EXPLORER]: FILE_EXPLORER_PANEL,
	[FILE_PANEL_TYPES.FILE_CODE_EDITOR]: FILE_CODE_EDITOR_PANEL,
	[FILE_PANEL_TYPES.FILE_DOWNLOAD]: FILE_DOWNLOAD_PANEL,
	[FILE_PANEL_TYPES.FILE_IMAGE_VIEWER]: FILE_IMAGE_VIEWER_PANEL,
	[FILE_PANEL_TYPES.FILE_MARKDOWN_EDITOR]: FILE_MARKDOWN_EDITOR_PANEL,
	[FILE_PANEL_TYPES.FILE_NOTEBOOK_EDITOR]: FILE_NOTEBOOK_EDITOR_PANEL,
	[FILE_PANEL_TYPES.FILE_PDF_VIEWER]: FILE_PDF_VIEWER_PANEL,
	[FILE_PANEL_TYPES.FILE_PPTX_VIEWER]: FILE_PPTX_VIEWER_PANEL,
	[FILE_PANEL_TYPES.FILE_MCP_EDITOR]: FILE_MCP_EDITOR_PANEL,
};
