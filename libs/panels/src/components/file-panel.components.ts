import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { FILE_PANEL_TYPES } from "../constants/file-panel.constants";
import { FILE_EXPLORER_PANEL } from "./explorers";
import { createFileViewPanel } from "./file-view-panel";
import { FILE_MCP_EDITOR_PANEL } from "./mcp/file-mcp-editor-panel";
import {
	FileCodeView,
	FileDownloadView,
	FileImageView,
	FileMarkdownView,
	FileNotebookView,
	FilePdfView,
	FilePptxView,
} from "./views";

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
	[FILE_PANEL_TYPES.FILE_CODE_EDITOR]: createFileViewPanel({
		name: "Editor",
		view: FileCodeView,
	}),
	[FILE_PANEL_TYPES.FILE_DOWNLOAD]: createFileViewPanel({
		name: "Download",
		view: FileDownloadView,
	}),
	[FILE_PANEL_TYPES.FILE_IMAGE_VIEWER]: createFileViewPanel({
		name: "Image",
		view: FileImageView,
	}),
	[FILE_PANEL_TYPES.FILE_MARKDOWN_EDITOR]: createFileViewPanel({
		name: "Markdown",
		view: FileMarkdownView,
	}),
	[FILE_PANEL_TYPES.FILE_NOTEBOOK_EDITOR]: createFileViewPanel({
		name: "Notebook",
		view: FileNotebookView,
	}),
	[FILE_PANEL_TYPES.FILE_PDF_VIEWER]: createFileViewPanel({
		name: "PDF",
		view: FilePdfView,
	}),
	[FILE_PANEL_TYPES.FILE_PPTX_VIEWER]: createFileViewPanel({
		name: "PowerPoint",
		view: FilePptxView,
	}),
	[FILE_PANEL_TYPES.FILE_MCP_EDITOR]: FILE_MCP_EDITOR_PANEL,
};
