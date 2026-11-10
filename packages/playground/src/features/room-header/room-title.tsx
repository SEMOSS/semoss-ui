import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import { useRoomActionsContext } from "@/features/room-actions/room-actions.context";
import { RoomName } from "@/features/room-name/room-name";

/**
 * The room's name at the start of its header, as {@link RoomName} shows it in
 * the sidebar too. A double-click on it, or `/rename` in the slash menu, edits
 * it in place. Renders inside a `RoomActionsProvider`.
 */
export const RoomTitle = observer(() => {
	const { t } = useTranslation("room");
	const context = useRoomActionsContext();
	const headingRef = useRef<HTMLHeadingElement>(null);
	// Enter and Escape hand focus back to the name; a click elsewhere keeps it
	const shouldRefocus = useRef(false);
	const isRenaming = context?.isRenaming ?? false;

	useEffect(() => {
		if (isRenaming || !shouldRefocus.current) return;
		shouldRefocus.current = false;
		headingRef.current?.focus();
	}, [isRenaming]);

	if (!context) return null;

	const name = (
		<RoomName
			name={context.room.metadata.name ?? ""}
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
});
