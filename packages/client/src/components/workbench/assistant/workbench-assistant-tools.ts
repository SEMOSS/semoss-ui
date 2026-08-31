import { isRequestUserInputAction } from "@semoss/sdk";
import type { BuildPendingAction, BuildTool } from "@/stores/workbench";

/** Family a tool belongs to for phase titles and rollup rows. */
export type ToolFamily =
	| "read"
	| "search"
	| "skill"
	| "plan"
	| "edit"
	| "verify"
	| "other";

/**
 * Read a non-empty string value out of a tool metadata record.
 *
 * @name metadataString
 * @param metadata - The tool metadata record, if any.
 * @param key - The metadata key to read.
 * @return The trimmed string value, or null when absent or not a string.
 */
const metadataString = (
	metadata: Record<string, unknown> | undefined,
	key: string,
): string | null => {
	const value = metadata?.[key];
	return typeof value === "string" && value.trim() ? value.trim() : null;
};

/**
 * Strip the MCP routing alias (`a<engine-id>_<tool-name>`) from a tool name,
 * preferring the original name recorded in metadata. Requiring a UUID-like or
 * hyphenated engine id avoids mangling names such as `analyze_data` that
 * merely begin with "a".
 *
 * @name stripMcpToolAlias
 * @param name - The possibly-aliased tool name.
 * @param metadata - Tool metadata that may record the original name.
 * @return The original tool name, or the input when no alias is detected.
 */
const stripMcpToolAlias = (
	name: string,
	metadata?: Record<string, unknown>,
): string => {
	const originalName =
		metadataString(metadata, "SMSS_ORIGINAL_TOOL_NAME") ??
		metadataString(metadata, "original_name");

	if (originalName) return originalName;

	const aliasMatch = name.match(
		/^a(?:[0-9a-f]{8}(?:[0-9a-f-]{0,28})?|[a-z0-9]+(?:-[a-z0-9]+)+)_(.+)$/i,
	);

	return aliasMatch?.[1] || name;
};

/**
 * Turn a raw tool name into a human-friendly title-cased label
 * ("query_database" → "Query Database") after stripping any MCP alias.
 *
 * @name friendlyToolName
 * @param name - The raw tool name.
 * @param metadata - Tool metadata used to resolve the original name.
 * @return The title-cased label, or "Tool" when nothing remains.
 */
export const friendlyToolName = (
	name: string,
	metadata?: Record<string, unknown>,
): string =>
	stripMcpToolAlias(name, metadata)
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.trim()
		.replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Tool";

/**
 * Resolve the display name for a tool row, preferring the de-aliased or
 * original name and falling back to the tool's title before its raw name.
 *
 * @name displayToolName
 * @param tool - The tool's name, title, and metadata.
 * @return The human-friendly tool display name.
 */
export const displayToolName = (
	tool: Pick<BuildTool, "name" | "title" | "metadata">,
): string => {
	const originalName = stripMcpToolAlias(tool.name, tool.metadata);
	return friendlyToolName(
		originalName !== tool.name ? originalName : tool.title || tool.name,
		tool.metadata,
	);
};

/**
 * Determine whether a tool is still in flight.
 *
 * @name isToolActive
 * @param tool - The tool invocation to check.
 * @return True while the tool is queued or running.
 */
export const isToolActive = (tool: BuildTool): boolean =>
	["QUEUED", "RUNNING"].includes(tool.status.toUpperCase());

/**
 * Determine whether a RequestUserInput tool is represented by a durable
 * pending action. The action row is the source of truth while a run is paused;
 * durable message reconstruction may still label the corresponding tool call
 * as QUEUED after a page refresh.
 *
 * @name isPendingUserInputTool
 * @param tool - Tool invocation that may duplicate a structured input card.
 * @param pendingActions - Durable actions currently awaiting user input.
 * @return True when the tool should be hidden in favor of its input card.
 */
export const isPendingUserInputTool = (
	tool: BuildTool,
	pendingActions: BuildPendingAction[],
): boolean => {
	if (
		!isRequestUserInputAction({
			toolName: tool.name,
			toolMeta: tool.metadata,
		})
	) {
		return false;
	}

	return pendingActions.some(
		(action) =>
			isRequestUserInputAction(action) &&
			(action.toolCallId === tool.id || action.toolCallId == null),
	);
};

/**
 * Determine whether a tool ended unsuccessfully.
 *
 * @name isToolFailure
 * @param tool - The tool invocation to check.
 * @return True when the tool failed, was rejected, cancelled, or errored.
 */
export const isToolFailure = (tool: BuildTool): boolean =>
	["FAILED", "REJECTED", "CANCELLED", "ERROR"].includes(
		tool.status.toUpperCase(),
	);

/**
 * Determine whether a status string is a successful terminal state.
 *
 * @name isCompleteStatus
 * @param status - The status string to check (case-insensitive).
 * @return True for COMPLETED/SUCCESS/SUCCEEDED statuses.
 */
export const isCompleteStatus = (status: string): boolean =>
	["COMPLETED", "SUCCESS", "SUCCEEDED"].includes(status.toUpperCase());

/**
 * Map a run/tool status to a user-facing label ("RUNNING" → "Working"),
 * falling back to a lowercased, de-underscored form for unknown statuses.
 *
 * @name statusLabel
 * @param status - The status string to map (case-insensitive).
 * @return The user-facing status label.
 */
export const statusLabel = (status: string): string => {
	switch (status.toUpperCase()) {
		case "SUBMITTED":
			return "Queued";
		case "RUNNING":
			return "Working";
		case "INPUT_REQUIRED":
			return "Needs input";
		case "COMPLETED":
		case "SUCCESS":
		case "SUCCEEDED":
			return "Completed";
		case "FAILED":
			return "Failed";
		case "CANCELLED":
			return "Cancelled";
		default:
			return status.toLowerCase().replaceAll("_", " ");
	}
};

/**
 * Bucket a tool into a family for grouping by matching keywords in its name
 * and title (verify, edit, search, skill, plan, read, other).
 *
 * @name toolFamily
 * @param tool - The tool whose name and title are matched.
 * @return The family the tool belongs to.
 */
export const toolFamily = (tool: BuildTool): ToolFamily => {
	const value = `${tool.name} ${tool.title ?? ""}`.toLowerCase();
	if (/build|publish|test|verify|lint|compile|type.?check/.test(value)) {
		return "verify";
	}
	if (
		/edit|write|save|create|patch|delete|move|rename|insert|update/.test(
			value,
		)
	) {
		return "edit";
	}
	if (/grep|glob|search|find|query/.test(value)) return "search";
	if (/skill|memor/.test(value)) return "skill";
	if (/todo|plan/.test(value)) return "plan";
	if (/read|list|view|inspect/.test(value)) return "read";
	return "other";
};

/**
 * Choose the heading for a grouped tool phase from the family of the latest
 * active tool (or the last tool when none are active).
 *
 * @name phaseTitle
 * @param tools - The tools grouped into the phase.
 * @return The phase heading (e.g. "Exploring the workspace").
 */
export const phaseTitle = (tools: BuildTool[]): string => {
	const activeTool = [...tools].reverse().find(isToolActive);
	const family = toolFamily(activeTool ?? tools[tools.length - 1]);
	if (family === "verify") return "Verifying the results";
	if (family === "edit") return "Applying changes";
	if (family === "plan") return "Planning the work";
	if (["read", "search", "skill"].includes(family)) {
		return "Exploring the workspace";
	}
	return "Working through the request";
};

/**
 * Pretty-print a pending action's request payload for the details block:
 * strings pass through, objects are JSON-stringified with indentation.
 *
 * @name actionDetails
 * @param action - The pending action whose toolArgs are rendered.
 * @return The printable payload, or null when the action has no args.
 */
export const actionDetails = (action: BuildPendingAction): string | null => {
	if (action.toolArgs == null) return null;
	if (typeof action.toolArgs === "string") return action.toolArgs;
	try {
		return JSON.stringify(action.toolArgs, null, 2);
	} catch {
		return String(action.toolArgs);
	}
};
