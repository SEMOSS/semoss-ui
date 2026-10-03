import { isRecord } from "@semoss/utility/object";
import {
	FOLDER_TOOL_NAMES,
	type FolderToolExecution,
	type FolderToolName,
	getUsualFolderToolExecution,
} from "./folder-tools";

/**
 * The tools every chat offers the model unless its settings disable them:
 * the folder tools, which this browser runs in Chat Files.
 */
export const DEFAULT_TOOL_NAMES: readonly FolderToolName[] =
	Object.values(FOLDER_TOOL_NAMES);

/**
 * How a default tool runs: on its own, once the user approves each call, or
 * not at all, which leaves it out of the messages. The same words a room
 * toolbox uses for its tools.
 */
export type DefaultToolMode = FolderToolExecution | "disabled";

/** Every mode, in the order the settings list them. */
export const DEFAULT_TOOL_MODES: readonly DefaultToolMode[] = [
	"auto",
	"ask",
	"disabled",
];

const isMode = (value: unknown): value is DefaultToolMode =>
	DEFAULT_TOOL_MODES.includes(value as DefaultToolMode);

/**
 * How a chat runs one default tool, from its `defaultTools` option. A tool
 * the option does not name runs its usual way, reading on its own and
 * changing once approved, so a chat that never changed them, or a tool added
 * later, needs nothing stored.
 *
 * @param setting - The chat's `defaultTools` option.
 * @param name - The tool.
 * @return Its mode.
 */
export const getDefaultToolMode = (
	setting: unknown,
	name: FolderToolName,
): DefaultToolMode => {
	const stored = isRecord(setting) ? setting[name] : undefined;
	return isMode(stored) ? stored : getUsualFolderToolExecution(name);
};

/**
 * The `defaultTools` option after setting one tool's mode. Only tools set
 * apart from their usual way are kept.
 *
 * @param setting - The option as stored.
 * @param name - The tool.
 * @param mode - Its new mode.
 * @return The modes to store, by tool.
 */
export const setDefaultToolMode = (
	setting: unknown,
	name: FolderToolName,
	mode: DefaultToolMode,
): Partial<Record<FolderToolName, DefaultToolMode>> => {
	const next: Partial<Record<FolderToolName, DefaultToolMode>> = {};
	for (const tool of DEFAULT_TOOL_NAMES) {
		const toolMode =
			tool === name ? mode : getDefaultToolMode(setting, tool);
		if (toolMode !== getUsualFolderToolExecution(tool)) {
			next[tool] = toolMode;
		}
	}
	return next;
};
