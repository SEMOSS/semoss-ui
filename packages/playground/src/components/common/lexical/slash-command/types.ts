import type { ReactNode } from "react";

/** The groups the slash menu lists its commands under, in this order. */
export const SLASH_COMMAND_GROUPS = [
	"chat",
	"workspace",
	"room",
	"prompts",
] as const;

/** One of the slash menu's groups. */
export type SlashCommandGroup = (typeof SLASH_COMMAND_GROUPS)[number];

export interface SlashCommand {
	/** Stable key, and what Tab completes the query to. */
	id: string;
	/** The command's name, as it is shown and matched. */
	label: string;
	/** What the command does. */
	description?: string;
	/** The group the menu lists the command under. */
	group: SlashCommandGroup;
	/** Other words the command is found by, such as its old names. */
	keywords?: string[];
	/** The command's icon, sized by the menu. */
	icon: ReactNode;
	onExecute: () => void;
	/** If true, the command is hidden until at least 1 character is typed */
	hiddenInMenu?: boolean;
	/** If true, selecting the command fires onExecute immediately without inserting a chip */
	noChip?: boolean;
	/** If true, the command is shown as disabled (non-selectable) while the model is responding or the latest response has tool calls */
	disableWithTools?: boolean;
}
