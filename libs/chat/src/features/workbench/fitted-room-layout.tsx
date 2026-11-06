import { useRoomSelector } from "@semoss/sdk/react";
import { RoomLayout, type RoomLayoutProps } from "../conversation/room-layout";
import type { RoomUiStore } from "./room-ui.store";
import { useWorkbenchFitWidth } from "./use-workbench-fit-width";

/** Props for {@link FittedRoomLayout}. */
export type FittedRoomLayoutProps = Omit<
	RoomLayoutProps,
	"isWorkbenchOpen" | "workbenchFitWidth"
> & {
	/** The room whose Workspace sits beside its conversation. */
	room: RoomUiStore;
	/** Whether the Workspace fills its default share instead of fitting. */
	shouldFill?: boolean;
};

/**
 * A room's split view whose Workspace opens as wide as its content (the
 * rail, and a rail panel when one is open) until a tab opens in its main area
 * or the user drags the divider.
 */
export const FittedRoomLayout = ({
	room,
	shouldFill = false,
	...props
}: FittedRoomLayoutProps) => {
	const fitWidth = useWorkbenchFitWidth(room);
	const isWorkbenchOpen = useRoomSelector(room, (r) => r.sidebar.isOpen);
	return (
		<RoomLayout
			{...props}
			isWorkbenchOpen={isWorkbenchOpen}
			workbenchFitWidth={shouldFill ? null : fitWidth}
		/>
	);
};
