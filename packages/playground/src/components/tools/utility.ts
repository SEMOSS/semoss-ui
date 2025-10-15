import type { App, Engine, Toolbox } from "@/types";

/**
 * Get a unique key for a tool
 * @param tool The tool to get the key for
 * @returns The unique key for the tool
 */
export const getToolbox = (item: Engine | App): Toolbox => {
	let id = "";
	let name = "";
	let type: Toolbox["type"] = "DATABASE";

	// Type guard to check if item is App
	if ("project_id" in item && "project_name" in item) {
		id = item.project_id;
		type = "APP";
		name = item.project_name;
	} else if ("app_id" in item && "app_name" in item) {
		id = item.app_id;
		name = item.app_name;
		type = item.app_type;
	}

	return {
		id: id,
		type: type,
		name: name,
		description: "",
		tags: [],
	};
};
