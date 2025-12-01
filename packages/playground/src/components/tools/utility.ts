import type { App, Engine, MCP, Workspace } from "@/types";

/**
 * MyEngineProjects returns responses in a strange foramt where Engines and Apps have different structures.
 * This function normalizes them into a common Toolbox format.
 * @param tool The engine or app to convert
 * @returns The normalized MCP object
 */
export const engineProjectToMCP = (tool: Engine | App): MCP => {
	if ("app_type" in tool) {
		// It's an Engine
		return {
			type: tool.app_type,
			id: tool.app_id,
			name: tool.app_name,
			description: tool.description || "",
			tags: [], // Tags are not provided in the current response
		};
	} else {
		// It's an App
		return {
			type: "PROJECT",
			id: tool.project_id,
			name: tool.project_name,
			description: tool.description || "",
			tags: [], // Tags are not provided in the current response
		};
	}
};

/**
 * Occasionally it may be useful to return the return of GetWorkspace into an App format.
 * @param workspace The workspace to convert
 * @returns The app
 */
export const workspaceToApp = (
	workspace: Workspace,
): App & {
	project_type: "WORKSPACE";
} => ({
	project_id: workspace.workspace_id,
	project_name: workspace.name,
	description: workspace.description,
	project_date_created: workspace.date_created,
	project_type: "WORKSPACE",
});
