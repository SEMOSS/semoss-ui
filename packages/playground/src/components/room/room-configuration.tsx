import { observer } from "mobx-react-lite";
import { toast } from "@semoss/ui/next";
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
				onClose={(success, { model, options }) => {
					if (success) {
						if (model) {
							room.setModel(model);
							chat.setSelectedModel(model);
						}

						if (options) {
							room.setOptions(options);
						}

						toast.success("Options updated");
					}
				}}
			/>
		);
	},
);
