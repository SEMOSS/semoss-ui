import { observer } from "mobx-react-lite";
import { OptionsMenu } from "@/components";
import type { RoomStore } from "@/stores";

interface RoomControlsProps {
	/** Room to render */
	room: RoomStore;
}

export const RoomControls: React.FC<RoomControlsProps> = observer((props) => {
	const { room } = props;

	return (
		<OptionsMenu
			options={room.options}
			setOptions={(o) => {
				room.setOptions(o);
			}}
			onClose={() => {
				room.closeSidebar();
			}}
		/>
	);
});
