import { observer } from "mobx-react-lite";
import {
	RoomLayout,
	type RoomLayoutProps,
} from "@/features/conversation/room-layout";
import type { RoomStore } from "@/stores/room/room.store";
import { useWorkbenchFitWidth } from "./use-workbench-fit-width";

export type FittedRoomLayoutProps = Omit<
	RoomLayoutProps,
	"isWorkbenchOpen" | "workbenchFitWidth"
> & {
	/** The room whose Workspace sits beside its conversation. */
	room: RoomStore;
	/** Whether the Workspace fills its default share instead of fitting. */
	shouldFill?: boolean;
};

/**
 * A room's split view whose Workspace opens as wide as its content (the
 * rail, and a rail panel when one is open) until a tab opens in its main area
 * or the user drags the divider.
 */
export const FittedRoomLayout = observer(
	({ room, shouldFill = false, ...props }: FittedRoomLayoutProps) => {
		const fitWidth = useWorkbenchFitWidth(room);
		return (
			<RoomLayout
				{...props}
				isWorkbenchOpen={room.sidebar.isOpen}
				workbenchFitWidth={shouldFill ? null : fitWidth}
			/>
		);
	},
);
