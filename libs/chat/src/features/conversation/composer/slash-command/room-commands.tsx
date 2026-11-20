import { useRoomActionsContext } from "../../../room/actions/room-actions.context";
import { useRoomActionItems } from "../../../room/actions/use-room-action-items";
import { SlashCommand } from "./slash-command";

/**
 * The "/" menu's Room group: the room's own actions, inside a room. They
 * share their names with the room's cog menu.
 */
export const RoomCommands = () => {
	const roomActions = useRoomActionsContext();
	const items = useRoomActionItems();

	return items.map((item) => {
		const Icon = item.icon;
		return (
			<SlashCommand
				key={item.id}
				name={item.id}
				group="room"
				label={item.label}
				description={item.description}
				keywords={item.keywords}
				icon={<Icon />}
				// the composer keeps focus as the menu closes; rename after that
				onSelect={
					item.id === "rename" && roomActions
						? () => setTimeout(roomActions.startRenaming, 0)
						: item.onSelect
				}
			/>
		);
	});
};
