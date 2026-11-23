import { createElement } from "react";
import { P } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { TeamsIcon } from "@/components/common/app-icons";
import { useRoomEmail } from "./room-email.context";
import { LIVE_TEAMS_NOTICE, RoomTeamsReader } from "./room-teams-reader";

export const ROOM_TEAMS_SOURCE_PANEL_TYPE = "collaboration-teams-source";

/** Read the Teams chat a room was opened from, oldest message first. */
function RoomTeamsSourcePanel(_props: WorkbenchPanelProps) {
	const {
		source,
		sourceMessages,
		isSourceLoading,
		sourceError,
		reloadSource,
	} = useRoomEmail();
	if (source?.channel !== "teams")
		return <P className="p-4">This room does not have a Teams chat.</P>;
	const allowedIds = new Set(source.messages.map((message) => message.id));
	return (
		<RoomTeamsReader
			title={source.title}
			messages={sourceMessages.filter(
				(message) => allowedIds.has(message.id) && !message.excluded,
			)}
			webLink={source.webLink}
			isLoading={isSourceLoading}
			error={sourceError}
			onRetry={reloadSource}
			notice={source.kind === "teams" ? LIVE_TEAMS_NOTICE : undefined}
			emptyText="No messages from this chat are available in this room."
		/>
	);
}

const ROOM_TEAMS_SOURCE_PANEL: WorkbenchPanelConfig<Record<string, never>> = {
	name: "Teams chat",
	icon: ({ className }) => createElement(TeamsIcon, { className }),
	content: RoomTeamsSourcePanel,
	mount: "keepAlive",
	canRename: false,
	canSplitTab: false,
	matches: () => true,
};

/** Register the Teams reader in the room's existing tool and file dock. */
export const ROOM_TEAMS_SOURCE_PANEL_COMPONENTS = {
	[ROOM_TEAMS_SOURCE_PANEL_TYPE]: ROOM_TEAMS_SOURCE_PANEL,
};
