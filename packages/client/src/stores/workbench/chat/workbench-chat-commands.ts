import type {
	WorkbenchChatEffort,
	WorkbenchChatPermissionMode,
} from "./workbench-chat.slice";

/** One selectable argument for a slash command. */
export interface SlashCommandOption {
	/** The argument value as typed ("high", "acceptEdits"). */
	value: string;
	/** Short description shown in the command menu. */
	description: string;
}

/** One slash command the composer understands. */
export interface SlashCommandDefinition {
	/** Command name without the leading slash. */
	name: string;
	/** Short description shown in the command menu. */
	description: string;
	/** Argument choices; omitted for argument-less commands. */
	options?: SlashCommandOption[];
}

/** Every slash command the chat composer understands. */
export const SLASH_COMMANDS: SlashCommandDefinition[] = [
	{
		name: "compact",
		description: "Summarize older messages to free up context",
	},
	{
		name: "effort",
		description: "Set reasoning effort for future runs",
		options: [
			{ value: "auto", description: "Model default" },
			{ value: "low", description: "Fastest, lightest reasoning" },
			{ value: "medium", description: "Balanced reasoning" },
			{ value: "high", description: "Deep reasoning" },
			{ value: "max", description: "Maximum reasoning" },
		],
	},
	{
		name: "thinking",
		description: "Toggle extended thinking for future runs",
		options: [
			{ value: "default", description: "Model default" },
			{ value: "on", description: "Think before responding" },
			{ value: "off", description: "Respond directly" },
		],
	},
	{
		name: "mode",
		description: "Set the permission mode for future runs",
		options: [
			{ value: "default", description: "Ask before gated tools run" },
			{ value: "acceptEdits", description: "Auto-accept file edits" },
			{ value: "plan", description: "Plan before acting" },
			{
				value: "bypassPermissions",
				description: "Skip all permission gates",
			},
		],
	},
];

/** Result of stripping slash commands out of a composer submission. */
export interface SlashCommandParseResult {
	/** The message with command lines removed. */
	text: string;
	/** New effort when set by a command; null resets to the model default. */
	effort?: WorkbenchChatEffort | null;
	/** New thinking flag when set by a command; null resets to the default. */
	thinking?: boolean | null;
	/** New permission mode when set by a command. */
	permissionMode?: WorkbenchChatPermissionMode;
	/** Whether a /compact command was given. */
	compact: boolean;
	/** Acknowledgement messages for applied commands. */
	feedback: string[];
	/** Error messages for malformed commands (bad arguments). */
	errors: string[];
	/** Whether the message asks for one-shot maximum reasoning. */
	ultrathink: boolean;
}

const EFFORT_VALUES = new Set(["auto", "low", "medium", "high", "max"]);
const THINKING_VALUES = new Set(["default", "on", "off"]);
const PERMISSION_MODES: Record<string, WorkbenchChatPermissionMode> = {
	default: "default",
	acceptedits: "acceptEdits",
	plan: "plan",
	bypasspermissions: "bypassPermissions",
};

/**
 * Parse slash commands out of a composer submission. Each line that starts
 * with a known "/command" is consumed (applying its setting or flag); every
 * other line — including unknown "/..." lines — stays in the outgoing
 * message. A known command with a bad argument is consumed and reported as an
 * error rather than sent to the agent. The word "ultrathink" anywhere in the
 * remaining message flags a one-shot maximum-reasoning run without being
 * removed.
 *
 * @name parseSlashCommands
 * @param input - The raw composer text.
 * @return The remaining message text plus the parsed settings and flags.
 */
export const parseSlashCommands = (input: string): SlashCommandParseResult => {
	const result: SlashCommandParseResult = {
		text: "",
		compact: false,
		feedback: [],
		errors: [],
		ultrathink: false,
	};

	const keptLines: string[] = [];
	for (const line of input.split("\n")) {
		const match = /^\/(\S+)(?:\s+(\S+))?\s*$/.exec(line.trim());
		const name = match?.[1]?.toLowerCase();
		const arg = match?.[2];

		if (name === "compact" && !arg) {
			result.compact = true;
			continue;
		}

		if (name === "effort") {
			const value = arg?.toLowerCase();
			if (value && EFFORT_VALUES.has(value)) {
				result.effort =
					value === "auto" ? null : (value as WorkbenchChatEffort);
				result.feedback.push(
					value === "auto"
						? "Reasoning effort reset to the model default."
						: `Reasoning effort set to ${value}.`,
				);
			} else {
				result.errors.push("Usage: /effort auto|low|medium|high|max");
			}
			continue;
		}

		if (name === "thinking") {
			const value = arg?.toLowerCase();
			if (value && THINKING_VALUES.has(value)) {
				result.thinking = value === "default" ? null : value === "on";
				result.feedback.push(
					value === "default"
						? "Extended thinking reset to the model default."
						: `Extended thinking turned ${value}.`,
				);
			} else {
				result.errors.push("Usage: /thinking default|on|off");
			}
			continue;
		}

		if (name === "mode") {
			const mode = arg ? PERMISSION_MODES[arg.toLowerCase()] : undefined;
			if (mode) {
				result.permissionMode = mode;
				result.feedback.push(`Permission mode set to ${mode}.`);
			} else {
				result.errors.push(
					"Usage: /mode default|acceptEdits|plan|bypassPermissions",
				);
			}
			continue;
		}

		keptLines.push(line);
	}

	result.text = keptLines.join("\n").trim();
	result.ultrathink = /\bultrathink\b/i.test(result.text);
	return result;
};

/** One entry in the composer's slash-command menu. */
export interface SlashSuggestion {
	/** Display label ("/effort" or an argument value like "high"). */
	label: string;
	/** Text the draft becomes when the suggestion is accepted. */
	insertText: string;
	/** Short description shown beside the label. */
	description: string;
}

/**
 * Compute the slash-command menu entries for the current draft: typing "/"
 * lists matching commands, and a completed command name followed by a space
 * lists its argument choices. Returns nothing once the draft is a complete
 * command (so Enter submits it), spans multiple lines, or doesn't start with
 * a slash.
 *
 * @name getSlashSuggestions
 * @param draft - The current composer draft.
 * @return The menu entries to offer, in display order.
 */
export const getSlashSuggestions = (draft: string): SlashSuggestion[] => {
	if (!draft.startsWith("/") || draft.includes("\n")) return [];

	const nameMatch = /^\/(\S*)$/.exec(draft);
	if (nameMatch) {
		const query = nameMatch[1].toLowerCase();
		const exact = SLASH_COMMANDS.find((command) => command.name === query);
		if (exact && !exact.options) return [];
		return SLASH_COMMANDS.filter((command) =>
			command.name.startsWith(query),
		).map((command) => ({
			label: `/${command.name}`,
			insertText: command.options
				? `/${command.name} `
				: `/${command.name}`,
			description: command.description,
		}));
	}

	const argMatch = /^\/(\S+)\s+(\S*)$/.exec(draft);
	if (argMatch) {
		const command = SLASH_COMMANDS.find(
			(candidate) => candidate.name === argMatch[1].toLowerCase(),
		);
		if (!command?.options) return [];
		const query = argMatch[2].toLowerCase();
		if (
			command.options.some(
				(option) => option.value.toLowerCase() === query,
			)
		) {
			return [];
		}
		return command.options
			.filter((option) => option.value.toLowerCase().startsWith(query))
			.map((option) => ({
				label: option.value,
				insertText: `/${command.name} ${option.value}`,
				description: option.description,
			}));
	}

	return [];
};
