import type {
	BuildPendingAction,
	BuildTool,
	UserInputQuestion,
	UserInputRequest,
} from "@/stores/workbench";

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
export const stripMcpToolAlias = (
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
 * Narrow an unknown value to a plain object record.
 *
 * @name isRecord
 * @param value - The value to test.
 * @return True when the value is a non-null, non-array object.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
	Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * Normalize one raw question from a RequestUserInput payload: validates the
 * question text, cleans its options, and infers the question type when not
 * declared (options imply single/multi select, otherwise free text).
 *
 * @name normalizeUserInputQuestion
 * @param value - The raw question value from the payload.
 * @param fallbackId - ID used when the question does not declare one.
 * @return The normalized question, or null when it cannot be rendered.
 */
const normalizeUserInputQuestion = (
	value: unknown,
	fallbackId: string,
): UserInputQuestion | null => {
	if (!isRecord(value) || typeof value.question !== "string") return null;
	const question = value.question.trim();
	if (!question) return null;

	const options = Array.isArray(value.options)
		? value.options.flatMap((option) => {
				if (!isRecord(option) || typeof option.label !== "string")
					return [];
				const label = option.label.trim();
				if (!label) return [];
				return [
					{
						label,
						value:
							typeof option.value === "string" &&
							option.value.trim()
								? option.value.trim()
								: label,
						description:
							typeof option.description === "string"
								? option.description.trim()
								: undefined,
						recommended: option.recommended === true,
					},
				];
			})
		: [];

	const declaredType = value.type;
	const type: UserInputQuestion["type"] =
		declaredType === "single_select" ||
		declaredType === "multi_select" ||
		declaredType === "text" ||
		declaredType === "confirm"
			? declaredType
			: options.length > 0
				? value.multiple === true
					? "multi_select"
					: "single_select"
				: "text";

	return {
		id:
			typeof value.id === "string" && value.id.trim()
				? value.id.trim()
				: fallbackId,
		question,
		type,
		options: options.length > 0 ? options : undefined,
		allowOther:
			typeof value.allowOther === "boolean" ? value.allowOther : true,
		required: typeof value.required === "boolean" ? value.required : true,
	};
};

/**
 * Parse a pending RequestUserInput action's args into a renderable form,
 * accepting the questions as either an array or a keyed record and JSON
 * strings as well as objects.
 *
 * @name parseUserInputRequest
 * @param action - The pending action whose toolArgs hold the request.
 * @return The parsed request, or null when no valid questions exist.
 */
export const parseUserInputRequest = (
	action: BuildPendingAction,
): UserInputRequest | null => {
	let value: unknown = action.toolArgs;
	if (typeof value === "string") {
		try {
			value = JSON.parse(value);
		} catch {
			return null;
		}
	}
	if (!isRecord(value)) return null;

	const rawQuestions = Array.isArray(value.questions)
		? value.questions.map(
				(question, index) => [String(index + 1), question] as const,
			)
		: isRecord(value.questions)
			? Object.entries(value.questions)
			: [];
	const questions = rawQuestions.flatMap(([fallbackId, question]) => {
		const normalized = normalizeUserInputQuestion(question, fallbackId);
		return normalized ? [normalized] : [];
	});
	if (questions.length === 0) return null;

	return {
		title: typeof value.title === "string" ? value.title : undefined,
		questions,
	};
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
