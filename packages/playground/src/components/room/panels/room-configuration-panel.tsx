import { Settings2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useContext } from "react";
import { ScrollArea } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useRoom } from "@/contexts/room.context";
import { DraftSettingsContext } from "@/features/workbench/draft-settings.context";
import { useChat } from "@/hooks/use-chat";
import { RoomOptionsForm } from "../room-options-form";

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
				{...draftSettings}
			/>
		</ScrollArea>
	);
});

/** The room's model and options form. One per sidebar. */
export const ROOM_CONFIGURATION_PANEL: WorkbenchPanelConfig = {
	name: "Settings",
	icon: ({ className }) => <Settings2Icon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: RoomConfigurationPanel,
};
