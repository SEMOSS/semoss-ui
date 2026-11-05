import { observer } from "mobx-react-lite";
import type { ComponentProps } from "react";
import { ConversationWorkspace } from "@/features/conversation/conversation-workspace";
import type { RoomStore } from "@/stores/room/room.store";
import { useWorkspaceFitWidth } from "./use-workspace-fit-width";

export type RoomConversationWorkspaceProps = Omit<
	ComponentProps<typeof ConversationWorkspace>,
	"isOpen" | "fitWidth"
> & {
	/** The room whose Workspace sits beside its conversation. */
	room: RoomStore;
};

/**
 * A room's conversation beside its Workspace, which opens as wide as its
 * content (the rail, and a rail panel when one is open) until a tab opens in
 * its main area or the user drags the divider.
 */
export const RoomConversationWorkspace = observer(
	({ room, ...props }: RoomConversationWorkspaceProps) => {
		const fitWidth = useWorkspaceFitWidth(room);
		return (
			<ConversationWorkspace
				{...props}
				isOpen={room.sidebar.isOpen}
				fitWidth={fitWidth}
			/>
		);
	},
);
