import { observer } from "mobx-react-lite";
import { RoomOptions } from "@/components";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";

interface RoomConfigurationProps {
	/** Room */
	room: RoomStore;
}

export const RoomConfiguration = observer((props: RoomConfigurationProps) => {
	const { room } = props;

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
			/>
		);
	},
);
