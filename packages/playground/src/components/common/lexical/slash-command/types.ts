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

/** One action the composer's "/" menu offers. */
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
	/** Runs the command once it is picked. */
	onExecute: () => void;
	/** Whether the command is disabled while the model responds or the latest response has tool calls. */
	isLockedWhileBusy?: boolean;
}
