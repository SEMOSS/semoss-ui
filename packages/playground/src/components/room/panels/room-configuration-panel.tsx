import { Settings2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useContext } from "react";
import { ScrollArea } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useRoom } from "@/contexts/room.context";
import { RoomToolsConnectorsSection } from "@/features/chat-tools/components/room-tools-connectors-section";
import { DraftSettingsContext } from "@/features/workbench/draft-settings.context";
import { useChat } from "@/hooks/use-chat";
import { RoomOptionsForm } from "../room-options-form";

/**
 * The room's settings: its model, instructions, knowledge, every tool the
 * assistant has, and the room's own actions. A new chat's draft settings
 * replace the room's, and leave out both the room's own toolbox, which is not
 * settled until the first message, and its actions, which need a room.
 */
const RoomConfigurationPanel = observer(() => {
	const room = useRoom();
	const { chat } = useChat();
	const draftSettings = useContext(DraftSettingsContext);
	return (
		<ScrollArea className="h-full w-full">
			<RoomOptionsForm
				disabled={
					room.isLoading ||
					room.latestResponseMessage?.isThinking ||
					room.latestResponseMessage?.hasUnfinishedTools
				}
				model={room.model}
				options={room.options}
				isAgentMode={room.mode === "agent"}
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
});

/** The room's model, options, and tools. One per sidebar. */
export const ROOM_CONFIGURATION_PANEL: WorkbenchPanelConfig = {
	name: "Settings",
	icon: ({ className }) => <Settings2Icon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: RoomConfigurationPanel,
};
