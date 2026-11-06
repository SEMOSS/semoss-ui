import { useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import { useOptionalRoomSelector } from "@semoss/sdk/react";
import { useRoomActionsContext } from "../room-actions/room-actions.context";
import { RoomNameField } from "./room-name-field";

/**
 * The room's name at the start of its header. Rename, from the More actions
 * menu or the slash menu, edits it in place with {@link RoomNameField}.
 * Renders inside a `RoomActionsProvider`.
 */
export const RoomTitle = () => {
	const { t } = useTranslation("room");
	const context = useRoomActionsContext();
	const headingRef = useRef<HTMLHeadingElement>(null);
	// Enter and Escape hand focus back to the name; a click elsewhere keeps it
	const shouldRefocus = useRef(false);
	const isRenaming = context?.isRenaming ?? false;
	const savedName = useOptionalRoomSelector(
		context?.room,
		(room) => room.metadata.name ?? "",
		"",
	);

	useEffect(() => {
		if (isRenaming || !shouldRefocus.current) return;
		shouldRefocus.current = false;
		headingRef.current?.focus();
	}, [isRenaming]);

	if (!context) return null;

	if (isRenaming) {
		return (
			<RoomNameField
				savedName={savedName}
				onRename={context.actions.rename}
				onClose={(isRefocusing) => {
					shouldRefocus.current = isRefocusing;
					context.stopRenaming();
				}}
			/>
		);
	}

	const name = savedName || t("header.untitled");
	return (
		<h1
			ref={headingRef}
			dir="auto"
			title={name}
			tabIndex={-1}
			className="min-w-0 truncate px-2 font-medium text-sm focus-visible:outline-none"
		>
			{name}
		</h1>
	);
};
