import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";
import { FILE_CODE_EDITOR_PANEL } from "./file-code-editor-panel";
import { FILE_DOWNLOAD_PANEL } from "./file-download-panel";
import { FILE_EXPLORER_PANEL } from "./file-explorer-panel";
import { FILE_IMAGE_VIEWER_PANEL } from "./file-image-viewer-panel";
import { FILE_MARKDOWN_EDITOR_PANEL } from "./file-markdown-editor-panel";
import { FILE_MCP_EDITOR_PANEL } from "./file-mcp-editor-panel";
import { FILE_NOTEBOOK_EDITOR_PANEL } from "./file-notebook-editor-panel";
import { FILE_PDF_VIEWER_PANEL } from "./file-pdf-viewer-panel";
import { FILE_PPTX_VIEWER_PANEL } from "./file-pptx-viewer-panel";

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
	[WORKBENCH_COMPONENTS.FILE_EXPLORER]: FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_CODE_EDITOR]: FILE_CODE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_DOWNLOAD]: FILE_DOWNLOAD_PANEL,
	[WORKBENCH_COMPONENTS.FILE_IMAGE_VIEWER]: FILE_IMAGE_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR]: FILE_MARKDOWN_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR]: FILE_NOTEBOOK_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PDF_VIEWER]: FILE_PDF_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PPTX_VIEWER]: FILE_PPTX_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MCP_EDITOR]: FILE_MCP_EDITOR_PANEL,
};

/** Whether an open panel's type is one of the file panels. */
export const isFilePanelType = (type: string): boolean =>
	type in FILE_PANEL_COMPONENTS;
