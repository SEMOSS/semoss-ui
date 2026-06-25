import type React from "react";

export interface SlashCommand {
	id: string;
	label: string;
	description?: string;
	icon: React.ComponentType<{ className?: string }>;
	onExecute: () => void;
	/** If true, the command is hidden until at least 1 character of its id is typed */
	hiddenInMenu?: boolean;
	/** If true, selecting the command fires onExecute immediately without inserting a chip */
	noChip?: boolean;
	/** If true, the command is shown as disabled (non-selectable) while the room is loading */
	disableDuringLoading?: boolean;
}
