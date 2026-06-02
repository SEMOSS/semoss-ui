import { observer } from "mobx-react-lite";
import { ScrollArea } from "@semoss/ui/next";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";
import { RoomOptionsForm } from "./room-options-form";

interface RoomConfigurationProps {
	/** Room to load */
	room: RoomStore;
}

export const RoomConfiguration: React.FC<RoomConfigurationProps> = observer(
	({ room }) => {
		const { chat } = useChat();

		return (
			<ScrollArea className="h-full w-full">
				<RoomOptionsForm
					model={room.model}
					options={room.options}
					profileDefaultModelId={chat.profileDefaultModelId}
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
	},
);
