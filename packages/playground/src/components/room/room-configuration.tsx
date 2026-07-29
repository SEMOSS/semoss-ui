import { observer } from "mobx-react-lite";
import { ScrollArea } from "@semoss/ui/next";
import { useApp } from "@/hooks";
import type { RoomStore } from "@/stores";
import { RoomOptionsForm } from "./room-options-form";

interface RoomConfigurationProps {
	/** Room to load */
	room: RoomStore;
}

export const RoomConfiguration: React.FC<RoomConfigurationProps> = observer(
	({ room }) => {
		const { app } = useApp();

		return (
			<ScrollArea className="h-full w-full">
				<RoomOptionsForm
					model={room.model}
					options={room.options}
					onModelChange={(model) => {
						if (model) {
							room.setModel(model);
							app.setSelectedModel(model);
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
