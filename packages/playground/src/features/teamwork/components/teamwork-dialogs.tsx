import type { TeamworkStore } from "../teamwork.store";
import { TeamworkConnectorsDialog } from "./teamwork-connectors-dialog";

/** Props for {@link TeamworkDialogs}. */
export interface TeamworkDialogsProps {
	/** The room's teamwork state. */
	teamwork: TeamworkStore;
}

/**
 * The connectors dialog for a room, mounted once next to the room's input so
 * every trigger (menu, chip, panel) opens the same one.
 */
export const TeamworkDialogs = ({ teamwork }: TeamworkDialogsProps) => (
	<TeamworkConnectorsDialog teamwork={teamwork} />
);
