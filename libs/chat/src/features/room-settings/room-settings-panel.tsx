import { Settings2Icon } from "lucide-react";
import { useContext } from "react";
import { ScrollArea } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useComposerSession } from "../conversation/composer/use-composer-session";
import { useRoom } from "../room/scope/room.context";
import { useRoomSelector } from "../room/store/use-room-selector";
import { DraftSettingsContext } from "./draft-settings.context";
import { RoomSettingsForm } from "./room-settings-form";
import { RoomToolsConnectorsSection } from "./tools/room-tools-connectors-section";

/**
 * The room's settings: its model, instructions, knowledge, every tool the
 * assistant has, and the room's own actions. A new chat's draft settings
 * replace the room's, and leave out both the room's own toolbox, which is not
 * settled until the first message, and its actions, which need a room.
 */
const RoomSettingsPanel = () => {
	const room = useRoom();
	const roomSession = useComposerSession(room);
	const isBusy = useRoomSelector(
		room,
		(current) =>
			current.isLoading ||
			Boolean(
				current.latestResponseMessage?.isThinking ||
					current.latestResponseMessage?.hasUnfinishedTools,
			),
	);
	// a new chat's draft Settings, which replace the room's below
	const draftSettings = useContext(DraftSettingsContext);
	return (
		<ScrollArea className="h-full w-full">
			{draftSettings ? (
				<RoomSettingsForm
					session={draftSettings.session}
					disabled={draftSettings.disabled}
				/>
			) : (
				<RoomSettingsForm
					session={roomSession}
					disabled={isBusy}
					connectorsSection={
						<RoomToolsConnectorsSection room={room} />
					}
				/>
			)}
		</ScrollArea>
	);
};

/** The room's model, options, and tools. One per Workspace. */
export const ROOM_SETTINGS_PANEL: WorkbenchPanelConfig = {
	name: "Settings",
	icon: ({ className }) => <Settings2Icon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: RoomSettingsPanel,
};
