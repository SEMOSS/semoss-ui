import { type ReactNode, useContext, useEffect } from "react";
import { MobileNavigationButton } from "@/features/navigation/mobile-navigation-button";
import { PageHeaderContext } from "@/features/navigation/page-header.context";

export interface RoomHeaderProps {
	/** The room's name and its menu, at the start of the row; a new chat has none. */
	title: ReactNode;
	/** The Workspace's places, at the end of the row. */
	actions: ReactNode;
}

/**
 * One narrow row above a room's conversation and Workspace: the room's title
 * at the start and the Workspace's places at the end. On mobile it also holds
 * the navigation button, in place of the layout's floating one, when it is
 * inside that layout.
 */
export function RoomHeader({ title, actions }: RoomHeaderProps) {
	const registerPageHeader = useContext(PageHeaderContext);

	useEffect(() => registerPageHeader?.(), [registerPageHeader]);

	return (
		<header className="flex h-14 min-w-0 items-center gap-1 px-2 md:h-11">
			{/* only a layout that takes the header's place for it has navigation */}
			{registerPageHeader && (
				<MobileNavigationButton placement="inline" />
			)}
			<div className="flex min-w-0 flex-1 items-center">{title}</div>
			{actions}
		</header>
	);
}
