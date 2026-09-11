/**
 * Panel type ids for the file panels.
 *
 * Split out of the client's `WORKBENCH_COMPONENTS` when the panels moved here.
 * The client spreads these into its own constant, so **the string values are a
 * storage contract** — `applySnapshot` prunes records whose type a host no
 * longer registers, so changing one silently drops that panel out of every
 * cached layout.
 */
export const FILE_PANEL_TYPES = {
	FILE_EXPLORER: "file-explorer",
	FILE_CODE_EDITOR: "file-code-editor",
	FILE_DOWNLOAD: "file-download",
	FILE_IMAGE_VIEWER: "file-image-viewer",
	FILE_MARKDOWN_EDITOR: "file-markdown-editor",
	FILE_NOTEBOOK_EDITOR: "file-notebook-editor",
	FILE_PDF_VIEWER: "file-pdf-viewer",
	FILE_PPTX_VIEWER: "file-pptx-viewer",
	FILE_MCP_EDITOR: "file-mcp-editor",
} as const;

/**
 * Paths the MCP toolbox affordances key off.
 *
 * `DRIVER_PATHS` is matched exactly (the file that *generates* a toolbox);
 * `JSON_PATHS` by prefix (the toolbox documents themselves).
 */
export const MCP = {
	DRIVER_PATHS: ["/py/mcp_driver.py"],
	JSON_PATHS: ["/mcp/py_mcp.json", "/mcp/pixel_mcp.json"],
} as const;
