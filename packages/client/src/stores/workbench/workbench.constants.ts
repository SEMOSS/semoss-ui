/** Component IDs shared by workbench state, commands, and renderers. */
export const WORKBENCH_COMPONENTS = {
	CHAT: "workbench-chat",
	FILE_EXPLORER: "engine-file-explorer",
	FILE_EDITOR: "engine-file-editor",
	MCP_EDITOR: "engine-mcp-editor",
	DATABASE_COLUMNS: "database-columns",
	DATABASE_QUERY: "database-query",
	DATABASE_RESULTS: "database-results",
	VECTOR_DOCUMENTS: "vector-documents",
	STORAGE_EXPLORER: "storage-file-explorer",
	MODEL_CHAT: "model-chat",
	ENGINE_SETTINGS: "engine-settings",
	PROJECT_FILE_EXPLORER: "project-file-explorer",
	PROJECT_FILE_EDITOR: "project-file-editor",
	PROJECT_MCP_EDITOR: "project-mcp-editor",
	PROJECT_TERMINAL: "project-terminal",
	PROJECT_SETTINGS: "project-settings",
	PROJECT_INSIGHT_EXPLORER: "project-insight-explorer",
	PROJECT_APP_RENDERER: "project-app-renderer",
	PROJECT_AGENT_EDITOR: "project-agent-editor",
} as const;

/**
 * localStorage key for one workbench's persisted layout. The `-v2` suffix is a manual
 * cache-bust — bump it whenever a default layout changes shape; old entries are orphaned,
 * not migrated (same convention as `smss-workspace--<projectId>-v7`).
 */
export const getWorkbenchCacheKey = (id: string) => `smss-workbench--${id}-v2`;
