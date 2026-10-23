import { isRequestUserInputAction } from "@semoss/sdk";
import { isRecord } from "@semoss/utility/object";
import type {
	BuildPendingAction,
	BuildRun,
	BuildTool,
} from "@/stores/assistant/assistant.runs";

export const ASSISTANT_TOOL_PANEL_TYPE = "workbench-assistant-tool";

/** Durable identifiers only; live data stays in the owning assistant store. */
export interface AssistantToolPanelIdentity {
	conversationId: string;
	runId: string;
	toolCallId: string;
}

/** Authored MCP presentation, with the same defaults as other room tool views. */
export interface AssistantToolUi {
	displayLocation: "inline" | "sidebar" | "hidden";
	autoOpen: boolean;
	resourceURI?: string;
	loadingMessage?: string;
}

/** Normalize untrusted tool metadata without granting it executable component access. */
export const getAssistantToolUi = (
	metadata?: Record<string, unknown>,
): AssistantToolUi | null => {
	const ui = metadata?.SMSS_MCP_UI;
	if (!isRecord(ui)) return null;
	return {
		displayLocation:
			"displayLocation" in ui &&
			(ui.displayLocation === "inline" || ui.displayLocation === "hidden")
				? ui.displayLocation
				: "sidebar",
		autoOpen: "autoOpen" in ui && ui.autoOpen === true,
		resourceURI:
			"resourceURI" in ui && typeof ui.resourceURI === "string"
				? ui.resourceURI
				: undefined,
		loadingMessage:
			"loadingMessage" in ui && typeof ui.loadingMessage === "string"
				? ui.loadingMessage
				: undefined,
	};
};

/** Pending actions can carry metadata and message identity before durable messages arrive. */
export const getPresentedTool = (run: BuildRun, tool: BuildTool): BuildTool => {
	const action = run.pendingActions.find(
		(item) => item.toolCallId === tool.id,
	);
	const metadata = { ...tool.metadata, ...action?.toolMeta };
	const savedUi = tool.metadata?.SMSS_MCP_UI;
	const pendingUi = action?.toolMeta?.SMSS_MCP_UI;
	if (isRecord(savedUi) && isRecord(pendingUi)) {
		metadata.SMSS_MCP_UI = { ...savedUi, ...pendingUi };
	}
	return {
		...tool,
		name: action?.toolName || tool.name,
		arguments: action?.editedArgs ?? action?.toolArgs ?? tool.arguments,
		metadata,
		messageId: action?.parentMessageId ?? tool.messageId,
	};
};

/** Present pending calls immediately, then reuse their identity when activity arrives. */
export const getPresentedTools = (run: BuildRun): BuildTool[] => {
	const tools = new Map(run.tools.map((tool) => [tool.id, tool]));
	for (const action of run.pendingActions) {
		if (!action.toolCallId || tools.has(action.toolCallId)) continue;
		tools.set(action.toolCallId, {
			id: action.toolCallId,
			name: action.toolName || "Tool",
			status: "QUEUED",
			timestamp:
				run.messages.find(
					(message) => message.id === action.parentMessageId,
				)?.timestamp ??
				run.messages.at(-1)?.timestamp ??
				run.dateCreated,
		});
	}
	return [...tools.values()].map((tool) => getPresentedTool(run, tool));
};

/** Supported authored page; portal projects still need their Blocks/Code type resolved. */
export type AssistantToolResource =
	| { kind: "page"; url: string }
	| {
			kind: "portal";
			owner: string;
			engineType: unknown;
			path: string;
			approvalUrl: string | null;
	  };

/** Accept backend portal paths and HTTP(S) URLs, never executable URL schemes. */
const portalToolUrl = (value?: string | null): string | null => {
	if (!value || value.includes("\\")) return null;
	if (!/^\/(?!\/)/.test(value) && !/^https?:\/\//i.test(value)) return null;
	try {
		const url = new URL(value, "https://semoss.invalid");
		return ["http:", "https:"].includes(url.protocol) ? value : null;
	} catch {
		return null;
	}
};

/** Shared eligibility for activity, automatic panel opening, and approval ownership. */
export const getAssistantToolResource = (
	run: BuildRun,
	tool: BuildTool,
): AssistantToolResource | null => {
	const ui = getAssistantToolUi(tool.metadata);
	const action = run.pendingActions.find(
		(item) => item.toolCallId === tool.id,
	);
	if (
		ui?.displayLocation === "hidden" ||
		(action && isRequestUserInputAction(action))
	)
		return null;
	const uri = ui?.resourceURI;
	const systemUrl = systemToolUrl(uri);
	if (systemUrl) return { kind: "page", url: systemUrl };
	if (uri?.includes("://")) return null;
	const approvalUrl = portalToolUrl(action?.uiUrl);
	const owner =
		tool.metadata?.SMSS_ENGINE_ID ?? tool.metadata?.SMSS_PROJECT_ID;
	if (
		uri?.startsWith("/") &&
		!uri.startsWith("//") &&
		typeof owner === "string" &&
		owner &&
		owner !== "__room__"
	) {
		return {
			kind: "portal",
			owner,
			engineType: tool.metadata?.SMSS_ENGINE_TYPE,
			path: uri,
			approvalUrl,
		};
	}
	return approvalUrl ? { kind: "page", url: approvalUrl } : null;
};

/** UI-owned actions must not also appear in generic or bulk approval controls. */
export const hasPendingToolUi = (
	run: BuildRun,
	action: BuildPendingAction,
): boolean => {
	if (
		!action.actionId ||
		!action.toolCallId ||
		isRequestUserInputAction(action)
	)
		return false;
	const tool = getPresentedTools(run).find(
		(item) => item.id === action.toolCallId,
	);
	return Boolean(tool && getAssistantToolResource(run, tool));
};

/** A pending interactive call or a finished result is ready to show its authored UI. */
export const isToolViewReady = (run: BuildRun, tool: BuildTool): boolean =>
	tool.output !== undefined ||
	["COMPLETED", "SUCCESS", "ERROR", "FAILED", "CANCELLED"].includes(
		tool.status.toUpperCase(),
	) ||
	run.pendingActions.some((action) => action.toolCallId === tool.id);

/** Resolve packaged system pages; reject malformed packages and path traversal. */
export const systemToolUrl = (uri?: string): string | null => {
	const match = uri?.match(
		/^system:\/\/([a-zA-Z0-9_-][a-zA-Z0-9._-]*)(\/[^?#]*)?([?#].*)?$/,
	);
	if (
		!match ||
		match[1] === "." ||
		match[1] === ".." ||
		/(?:^|\/)\.\.(?:\/|$)/.test(decodeURIComponentSafe(match[2] ?? ""))
	)
		return null;
	return `../../${match[1]}/dist${match[2] ?? "/"}${match[3] ?? ""}`;
};

/** Invalid percent encoding cannot resolve a tool page. */
const decodeURIComponentSafe = (value: string): string => {
	try {
		return decodeURIComponent(value);
	} catch {
		return "../";
	}
};
