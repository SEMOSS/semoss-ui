import type { PendingAgentAction } from "../../types";

/** One selectable option in a RequestUserInput question. */
export interface UserInputOption {
	/** Display label of the option. */
	label: string;
	/** Value submitted when the option is chosen. */
	value: string;
	/** Optional helper text shown under the label. */
	description?: string;
	/** True when the agent marked this option as recommended. */
	recommended?: boolean;
}

/** One question inside a RequestUserInput request. */
export interface UserInputQuestion {
	/** Stable id the answer is keyed by. */
	id: string;
	/** Question text shown to the user. */
	question: string;
	/** Input control the question renders as. */
	type: "single_select" | "multi_select" | "text" | "confirm";
	/** Choices for select-type questions. */
	options?: UserInputOption[];
	/** Whether a free-form "other" answer is allowed; defaults to true. */
	allowOther?: boolean;
}

/** The full structured request rendered as a form. */
export interface UserInputRequest {
	/** Optional heading above the questions. */
	title?: string;
	/** The questions to render, in order. */
	questions: UserInputQuestion[];
}

/**
 * Strip the MCP routing alias (`a<engine-id>_<tool-name>`) a room/workspace
 * MCP tool gets renamed to before reaching the model, preferring the
 * original name the backend records in `toolMeta.SMSS_ORIGINAL_TOOL_NAME`
 * when present. Explicit `paramValues.tools` injections (e.g. Agent47's own
 * copy of this tool) are never aliased, so this is a no-op for them.
 *
 * @param name - The possibly-aliased tool name.
 * @param toolMeta - The action's tool metadata, which may record the original name.
 * @return The original tool name, or the input when no alias is detected.
 */
const stripMcpToolAlias = (
	name: string,
	toolMeta?: Record<string, unknown> | null,
): string => {
	const originalName = toolMeta?.SMSS_ORIGINAL_TOOL_NAME;
	if (typeof originalName === "string" && originalName.trim()) {
		return originalName;
	}

	const aliasMatch = name.match(
		/^a(?:[0-9a-f]{8}(?:[0-9a-f-]{0,28})?|[a-z0-9]+(?:-[a-z0-9]+)+)_(.+)$/i,
	);
	return aliasMatch?.[1] || name;
};

/**
 * Normalize a tool name for comparison by stripping non-alphanumerics and
 * lowercasing.
 *
 * @param name - Raw tool name; may be undefined.
 * @return The normalized name, or an empty string when absent.
 */
const normalizeToolName = (name: string | null | undefined): string =>
	(name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();

/**
 * True when a pending action is a RequestUserInput question set. Handles
 * both an unaliased tool name (e.g. Agent47's own explicitly-injected copy
 * of this tool) and the `a<engine-id>_RequestUserInput` alias a room/
 * workspace MCP tool (e.g. the platform's `user-input` MCP) gets renamed to.
 *
 * @param action - Pending action to test, or just its tool name/metadata.
 * @return Whether the action's (de-aliased) tool name is "RequestUserInput".
 */
export const isRequestUserInputAction = (
	action:
		| Pick<PendingAgentAction, "toolName" | "toolMeta">
		| {
				toolName: string | null;
				toolMeta?: Record<string, unknown> | null;
		  },
): boolean =>
	normalizeToolName(
		stripMcpToolAlias(action.toolName ?? "", action.toolMeta),
	) === "requestuserinput";

/**
 * Narrow an unknown value to a plain object record.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
	Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * Normalize one raw question from a RequestUserInput payload: validates the
 * question text, cleans its options, and infers the question type when not
 * declared (options imply single/multi select, otherwise free text).
 *
 * @param value - The raw question value from the payload.
 * @param fallbackId - ID used when the question does not declare one.
 * @return The normalized question, or null when it cannot be rendered.
 */
export const normalizeUserInputQuestion = (
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
	};
};

/**
 * Parse a pending RequestUserInput action's args into a renderable form,
 * accepting the questions as either an array or a keyed record and JSON
 * strings as well as objects.
 *
 * @param action - The pending action whose toolArgs hold the request.
 * @return The parsed request, or null when no valid questions exist.
 */
export const parseUserInputRequest = (
	action: Pick<PendingAgentAction, "toolArgs">,
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
