import type { App, Engine, Toolbox } from "@/types";

/**
 * MyEngineProjects returns responses in a strange foramt where Engines and Apps have different structures.
 * This function normalizes them into a common Toolbox format.
 * @param tool The engine or app to convert
 * @returns The normalized Toolbox object
 */
export const engineProjectToToolbox = (tool: Engine | App): Toolbox => {
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
