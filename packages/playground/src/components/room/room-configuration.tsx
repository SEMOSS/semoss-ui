import { observer } from "mobx-react-lite";
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
				devThreshold={room.devThreshold}
				onDevThresholdChange={(value) => room.setDevThreshold(value)}
			/>
		);
	},
);
