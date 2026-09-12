import { Settings2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { ScrollArea } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useRoom } from "@/contexts";
import { useChat } from "@/hooks";
import { RoomOptionsForm } from "../room-options-form";

const RoomConfigurationPanel = observer(() => {
	const room = useRoom();
	const { chat } = useChat();

	return (
		<ScrollArea className="h-full w-full">
			<RoomOptionsForm
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
			/>
		</ScrollArea>
	);
});

/** The room's model and options form. One per sidebar. */
export const ROOM_CONFIGURATION_PANEL: WorkbenchPanelConfig = {
	name: "Configuration",
	icon: ({ className }) => <Settings2Icon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: RoomConfigurationPanel,
};
