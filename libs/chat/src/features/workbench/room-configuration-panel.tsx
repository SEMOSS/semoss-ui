import { Settings2Icon } from "lucide-react";
import { useContext } from "react";
import { ScrollArea } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useChatSession } from "../chat/use-chat-session";
import { RoomToolsConnectorsSection } from "../chat-tools/components/room-tools-connectors-section";
import { useRoom } from "../room/room.context";
import { useRoomSelector } from "../room/use-room-selector";
import { RoomOptionsForm } from "../room-settings/room-options-form";
import { DraftSettingsContext } from "./draft-settings.context";

/**
 * The room's settings: its model, instructions, knowledge, every tool the
 * assistant has, and the room's own actions. A new chat's draft settings
 * replace the room's, and leave out both the room's own toolbox, which is not
 * settled until the first message, and its actions, which need a room.
 */
const RoomConfigurationPanel = () => {
	const room = useRoom();
	const { chat } = useChatSession();
	const { isBusy, model, options, isAgentMode } = useRoomSelector(
		room,
		(current) => ({
			isBusy:
				current.isLoading ||
				current.latestResponseMessage?.isThinking ||
				current.latestResponseMessage?.hasUnfinishedTools,
			model: current.model,
			options: current.options,
			isAgentMode: current.mode === "agent",
		}),
	);
	const draftSettings = useContext(DraftSettingsContext);
	return (
		<ScrollArea className="h-full w-full">
			<RoomOptionsForm
				disabled={isBusy}
				model={model}
				options={options}
				isAgentMode={isAgentMode}
				onModelChange={(model) => {
					if (model) {
						room.setModel(model);
						chat.setSelectedModel(model);
					}
				}}
				onOptionsChange={(options) => {
					if (options) {
						room.setOptions(options);
					}
				}}
				connectorsSection={
					draftSettings ? undefined : (
						<RoomToolsConnectorsSection room={room} />
					)
				}
				{...draftSettings}
			/>
		</ScrollArea>
	);
};

/** The room's model, options, and tools. One per sidebar. */
export const ROOM_CONFIGURATION_PANEL: WorkbenchPanelConfig = {
	name: "Settings",
	icon: ({ className }) => <Settings2Icon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: RoomConfigurationPanel,
};
