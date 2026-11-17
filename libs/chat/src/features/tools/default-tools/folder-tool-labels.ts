import { getI18n } from "@semoss/i18n";
import { normalizeFolderPath } from "../folders/folder-path";
import {
	type DesktopToolName,
	type FolderToolName,
	getFolderToolOperation,
} from "./folder-tools";

/**
 * A path argument for display. Falls back to the raw text when it does not
 * normalize, so a refused path still shows what the model asked for.
 *
 * @param value - The raw argument.
 * @returns The path, or a label for the folder root.
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
 * The name the user sees for a folder or desktop tool, such as "Read File".
 *
 * @param name - A folder or desktop tool.
 * @returns Its translated title.
 */
export const getFolderToolTitle = (
	name: FolderToolName | DesktopToolName,
): string => getI18n().t(`chatTools:tools.titles.${name}`);

/**
 * A one-line summary of what a call acts on, such as `reports/q3.md`, shown
 * beside the tool's title while it waits and in its approval card.
 *
 * @param name - A folder tool.
 * @param args - The call's arguments.
 * @returns The summary.
 */
export const summarizeFolderToolCall = (
	name: FolderToolName | DesktopToolName,
	args: Record<string, unknown>,
): string => {
	switch (getFolderToolOperation(name)) {
		case "search":
			return typeof args.query === "string" ? args.query : "";
		case "move":
			return getI18n().t("chatTools:tools.moveSummary", {
				from: displayPath(args.from),
				to: displayPath(args.to),
			});
		default:
			return displayPath(args.path);
	}
};
