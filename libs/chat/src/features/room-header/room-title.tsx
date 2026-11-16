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
	const shouldRefocusRef = useRef(false);
	const isRenaming = context?.isRenaming ?? false;
	const roomName = useRoomSelector(
		context?.room,
		(room) => room.metadata.name,
	);

	// The heading only exists once the field closes, so focus moves after the render that shows it
	useEffect(() => {
		if (isRenaming || !shouldRefocusRef.current) return;
		shouldRefocusRef.current = false;
		headingRef.current?.focus();
	}, [isRenaming]);

	if (!context) return null;

	// The same name, as the heading's content or, while renaming, alone
	const name = (
		<RoomName
			name={roomName ?? ""}
			placeholder={t("header.untitled")}
			isRenaming={isRenaming}
			onStartRename={context.startRenaming}
			onRename={context.actions.rename}
			onStopRename={(shouldRefocus) => {
				shouldRefocusRef.current = shouldRefocus;
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
