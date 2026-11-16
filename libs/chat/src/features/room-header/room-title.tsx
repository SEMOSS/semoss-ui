import { useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import { useRoomSelector } from "../room/use-room-selector";
import { useRoomActionsContext } from "../room-actions/room-actions.context";
import { RoomName } from "../room-name/room-name";

/**
 * The room's name at the start of its header, as {@link RoomName} shows it in
 * the sidebar too. A double-click on it, or `/rename` in the slash menu, edits
 * it in place. Renders inside a `RoomActionsProvider`.
 */
export const RoomTitle = () => {
	const { t } = useTranslation("room");
	const context = useRoomActionsContext();
	const headingRef = useRef<HTMLHeadingElement>(null);
	// Enter and Escape hand focus back to the name; a click elsewhere keeps it
	const shouldRefocus = useRef(false);
	const isRenaming = context?.isRenaming ?? false;
	const roomName = useRoomSelector(
		context?.room,
		(room) => room.metadata.name,
	);

	useEffect(() => {
		if (isRenaming || !shouldRefocus.current) return;
		shouldRefocus.current = false;
		headingRef.current?.focus();
	}, [isRenaming]);

	if (!context) return null;

	const name = (
		<RoomName
			name={roomName ?? ""}
			placeholder={t("header.untitled")}
			isRenaming={isRenaming}
			onStartRename={context.startRenaming}
			onRename={context.actions.rename}
			onStopRename={(isRefocusing) => {
				shouldRefocus.current = isRefocusing;
				context.stopRenaming();
			}}
		/>
	);

	if (isRenaming) return name;

	return (
		<h1
			ref={headingRef}
			tabIndex={-1}
			className="min-w-0 px-2 font-medium text-sm focus-visible:outline-none"
		>
			{name}
		</h1>
	);
};
