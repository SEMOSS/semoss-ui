import { useStore } from "zustand";
import { ScrollArea } from "@semoss/ui/next";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";
import { RoomOptionsForm } from "./room-options-form";

interface RoomConfigurationProps {
	/** Room to load */
	room: RoomStore;
}

export const RoomConfiguration: React.FC<RoomConfigurationProps> = ({
	room,
}) => {
	const { chat } = useChat();
	const roomOptions = useStore(room, (s) => s.options);
	const model = useStore(room, (s) => s.model);

	return (
		<ScrollArea className="h-full w-full">
			<RoomOptionsForm
				model={model}
				options={roomOptions}
				onModelChange={(model) => {
					if (model) {
						room.setModel(model);
						chat.getState().setSelectedModel(model);
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
};
