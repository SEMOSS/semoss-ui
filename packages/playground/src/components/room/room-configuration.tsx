import { observer } from "mobx-react-lite";
import { RoomOptions } from "@/components";
import type { RoomStore } from "@/stores";

interface RoomConfigurationProps {
	/** Room */
	room: RoomStore;
}

export const RoomConfiguration = observer((props: RoomConfigurationProps) => {
	const { room } = props;

	return (
		<RoomOptions
			options={room.options}
			setOptions={(o) => {
				room.setOptions(o);
			}}
			setRoomModel={(modelId) => {
				room.setModel(modelId);
			}}
		/>
	);
});
