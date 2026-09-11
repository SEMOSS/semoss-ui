import { observer } from "mobx-react-lite";
import { ScrollArea } from "@semoss/ui/next";
import { useRoom } from "@/contexts";
import { useChat } from "@/hooks";
import { RoomOptionsForm } from "./room-options-form";

export const RoomConfiguration: React.FC = observer(() => {
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
