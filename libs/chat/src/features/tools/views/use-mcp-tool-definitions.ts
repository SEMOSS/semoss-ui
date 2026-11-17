import { useEffect, useState } from "react";
import { getMcpTools } from "@semoss/sdk";
import { isRecord } from "@semoss/utility/object";
import type { ToolFieldSchema } from "./tool-field";

/** One tool of an app's MCP document, with the schema its form is built from. */
export interface McpToolDefinition {
	/** The tool's name. */
	name: string;
	/** The name to show. */
	title?: string;
	/** What it does. */
	description?: string;
	/** Its arguments. */
	inputSchema: {
		properties?: Record<string, ToolFieldSchema>;
		required?: string[];
	};
}

/** What {@link useMcpToolDefinitions} returns. */
export interface McpToolDefinitions {
	/** How the read went. */
	status: "LOADING" | "SUCCESS" | "ERROR";
	/** The app's tools, once read. */
	tools: McpToolDefinition[];
}

/**
 * The tools of an MCP document, as the backend returns it.
 *
 * @param document - The document.
 * @returns Each tool with a name; a tool without a schema has an empty one.
 */
const readToolDefinitions = (document: unknown): McpToolDefinition[] => {
	const tools =
		isRecord(document) && Array.isArray(document.tools)
			? document.tools
			: [];
	return tools.flatMap((tool): McpToolDefinition[] =>
		isRecord(tool) && typeof tool.name === "string"
			? [
					{
						name: tool.name,
						title:
							typeof tool.title === "string"
								? tool.title
								: undefined,
						description:
							typeof tool.description === "string"
								? tool.description
								: undefined,
						// the schema is the tool's own JSON schema, drawn as it is
						inputSchema: isRecord(tool.inputSchema)
							? (tool.inputSchema as McpToolDefinition["inputSchema"])
							: {},
					},
				]
			: [],
	);
};

/**
 * The tools a project offers, read with `GetMCPTools` in the room's insight
 * when the view mounts and whenever the project changes. A read that lands
 * after the project changed is dropped.
 *
 * @param app - The project.
 * @param insightId - The room's insight.
 * @returns The tools and how the read went.
 */
export const useMcpToolDefinitions = (
	app: string,
	insightId: string,
): McpToolDefinitions => {
	const [state, setState] = useState<McpToolDefinitions & { app: string }>({
		app: app,
		status: "LOADING",
		tools: [],
	});

	useEffect(() => {
		let isCurrent = true;
		getMcpTools({ id: app, type: "PROJECT" }, insightId).then(
			(document) => {
				if (isCurrent) {
					setState({
						app: app,
						status: "SUCCESS",
						tools: readToolDefinitions(document),
					});
				}
			},
			() => {
				if (isCurrent) {
					setState({ app: app, status: "ERROR", tools: [] });
				}
			},
		);
		return () => {
			isCurrent = false;
		};
	}, [app, insightId]);

	// nothing has been read for this project yet
	if (state.app !== app) {
		return { status: "LOADING", tools: [] };
	}
	return { status: state.status, tools: state.tools };
};
