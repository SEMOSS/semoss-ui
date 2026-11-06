import { getI18n } from "@semoss/i18n";
import {
	type ChatFilesToolLabels,
	FOLDER_TOOL_NAMES,
	type FolderToolName,
	normalizeFolderPath,
} from "@semoss/sdk";

/**
 * A path argument for display. Falls back to the raw text when it does not
 * normalize, so a refused path still shows what the model asked for.
 *
 * @param value - The raw argument.
 * @return The path, or a label for the folder root.
 */
const displayPath = (value: unknown): string => {
	try {
		return (
			normalizeFolderPath(value) ||
			getI18n().t("chatTools:tools.rootFolder")
		);
	} catch {
		return typeof value === "string" ? value : "";
	}
};

/**
 * The name the user sees for a folder tool, such as "Read File".
 *
 * @param name - A folder tool.
 * @return Its translated title.
 */
const getFolderToolTitle = (name: FolderToolName): string =>
	getI18n().t(`chatTools:tools.titles.${name}`);

/**
 * A one-line summary of what a call acts on, such as `reports/q3.md`, shown
 * beside the tool's title while it waits and in its approval card.
 *
 * @param name - A folder tool.
 * @param args - The call's arguments.
 * @return The summary.
 */
const summarizeFolderToolCall = (
	name: FolderToolName,
	args: Record<string, unknown>,
): string => {
	switch (name) {
		case FOLDER_TOOL_NAMES.SEARCH:
			return typeof args.query === "string" ? args.query : "";
		case FOLDER_TOOL_NAMES.MOVE:
			return getI18n().t("chatTools:tools.moveSummary", {
				from: displayPath(args.from),
				to: displayPath(args.to),
			});
		default:
			return displayPath(args.path);
	}
};

/** The room's files tools, named in the user's language. */
export const FOLDER_TOOL_LABELS: ChatFilesToolLabels = {
	title: getFolderToolTitle,
	summarize: summarizeFolderToolCall,
};
