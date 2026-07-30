import { Env, Insight } from "@semoss/sdk";
import type { AutomationToolContext } from "../types/automation-tool.types";

type EnvWithTool = typeof Env & { TOOL?: unknown };

// Baked in at build time — this app is served from the web app, not a
// published project portal, so there is no semoss-env script to read these
// from at runtime unless it is (also) deployed the old way.
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
});

const semossEnvScript = document.getElementById("semoss-env");
if (semossEnvScript?.textContent) {
	try {
		Env.update(JSON.parse(semossEnvScript.textContent));
	} catch (error) {
		console.warn("Unable to parse SEMOSS environment payload", error);
	}
}

export const insight = new Insight();

let initialized = false;
let toolContext = normalizeToolContext((Env as EnvWithTool).TOOL);
const subscribers = new Set<(context: AutomationToolContext | null) => void>();

function normalizeToolContext(rawTool: unknown): AutomationToolContext | null {
	if (!rawTool || typeof rawTool !== "object") {
		return null;
	}

	const tool = rawTool as Record<string, unknown>;
	const parameters =
		tool.parameters &&
		typeof tool.parameters === "object" &&
		!Array.isArray(tool.parameters)
			? (tool.parameters as Record<string, unknown>)
			: {};

	// Extract the app/project ID from _meta (SMSS_PROJECT_ID) or the tool's own
	// arguments (parameters.project), covering both older and newer MCP shapes.
	const meta =
		tool._meta &&
		typeof tool._meta === "object" &&
		!Array.isArray(tool._meta)
			? (tool._meta as Record<string, unknown>)
			: {};
	const projectId =
		(typeof meta.SMSS_PROJECT_ID === "string" && meta.SMSS_PROJECT_ID) ||
		(typeof parameters.project === "string" && parameters.project) ||
		"";

	return {
		id: typeof tool.id === "string" ? tool.id : "",
		name: typeof tool.name === "string" ? tool.name : "",
		message: typeof tool.message === "string" ? tool.message : "",
		roomId: typeof tool.roomId === "string" ? tool.roomId : "",
		projectId,
		parameters,
		toolResponse: tool.tool_response,
	};
}

function setToolContext(nextToolContext: unknown) {
	toolContext = normalizeToolContext(nextToolContext);
	subscribers.forEach((subscriber) => {
		try {
			subscriber(toolContext);
		} catch (error) {
			console.warn("Unable to notify MCP tool context subscriber", error);
		}
	});
}

if (typeof window !== "undefined") {
	window.addEventListener("message", (event) => {
		if (!event?.data || event.data.type !== "SMSS_INIT_TOOL") {
			return;
		}
		setToolContext(event.data.tool);
	});
}

/**
 * Initializes the SEMOSS insight once. Safe to call multiple times — only the
 * first call does any work. Resolves the MCP tool context (if any), falling
 * back to whatever `SMSS_INIT_TOOL` postMessage has already delivered.
 */
export async function initSemoss(): Promise<AutomationToolContext | null> {
	if (initialized) {
		return toolContext;
	}

	try {
		const initializedContext = await insight.initialize();
		setToolContext(
			(initializedContext as { tool?: unknown } | undefined)?.tool ||
				(Env as EnvWithTool).TOOL ||
				toolContext,
		);
	} catch (error) {
		console.warn(
			"SEMOSS initialization failed; continuing without MCP context",
			error,
		);
	} finally {
		initialized = true;
	}

	return toolContext;
}

export function getMcpToolContext(): AutomationToolContext | null {
	return toolContext;
}

export function subscribeToMcpToolContext(
	listener: (context: AutomationToolContext | null) => void,
): () => void {
	subscribers.add(listener);
	listener(toolContext);
	return () => subscribers.delete(listener);
}
