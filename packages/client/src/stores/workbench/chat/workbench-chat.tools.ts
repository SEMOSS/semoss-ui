import type { AgentToolDefinition } from "@semoss/sdk/react";
import type { BuildPendingAction } from "./workbench-chat.runs";

/**
 * Client-defined tool injected on every workbench run so the agent can pause
 * and ask the user structured questions. `SMSS_MCP_EXECUTION: "ask"` makes
 * the run go INPUT_REQUIRED with a pending action the panel renders as a
 * form; the answer returns via RunMCPTool(decision=["respond"]).
 */
export const REQUEST_USER_INPUT_TOOL: AgentToolDefinition = {
	name: "RequestUserInput",
	title: "Request User Input",
	description:
		"Pause and ask the user one to three structured questions. Call this tool alone. Use concise choices and mark at most one option as recommended.",
	inputSchema: {
		type: "object",
		properties: {
			title: { type: "string" },
			questions: {
				type: "array",
				minItems: 1,
				maxItems: 3,
				items: {
					type: "object",
					properties: {
						id: { type: "string" },
						question: { type: "string" },
						type: {
							type: "string",
							enum: [
								"single_select",
								"multi_select",
								"text",
								"confirm",
							],
						},
						options: {
							type: "array",
							minItems: 2,
							maxItems: 5,
							items: {
								type: "object",
								properties: {
									label: { type: "string" },
									value: { type: "string" },
									description: { type: "string" },
									recommended: { type: "boolean" },
								},
								required: ["label", "value"],
							},
						},
						allowOther: { type: "boolean", default: true },
						required: { type: "boolean", default: true },
					},
					required: ["id", "question", "type"],
				},
			},
		},
		required: ["questions"],
	},
	_meta: {
		SMSS_MCP_EXECUTION: "ask",
		SMSS_TOOL_KIND: "workbench_user_input",
	},
};

/** One selectable option in a RequestUserInput question. */
export type UserInputOption = {
	/** Display label of the option. */
	label: string;
	/** Value submitted when the option is chosen. */
	value: string;
	/** Optional helper text shown under the label. */
	description?: string;
	/** True when the agent marked this option as recommended. */
	recommended?: boolean;
};

/** One question inside a RequestUserInput request. */
export type UserInputQuestion = {
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
	/** Whether an answer is required; defaults to true. */
	required?: boolean;
};

/** The full structured request rendered as a form. */
export type UserInputRequest = {
	/** Optional heading above the questions. */
	title?: string;
	/** The questions to render, in order. */
	questions: UserInputQuestion[];
};

/**
 * Normalize a tool name for comparison by stripping non-alphanumerics and
 * lowercasing.
 *
 * @name normalizeToolName
 * @param name - Raw tool name; may be undefined.
 * @return The normalized name, or an empty string when absent.
 */
const normalizeToolName = (name: string | undefined): string =>
	(name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();

/**
 * True when a pending action is a RequestUserInput question set.
 *
 * @name isRequestUserInputAction
 * @param action - Pending action to test.
 * @return Whether the action's tool name normalizes to "requestuserinput".
 */
export const isRequestUserInputAction = (action: BuildPendingAction): boolean =>
	normalizeToolName(action.toolName) === "requestuserinput";
