import { useState } from "react";
import { useSidebar } from "@semoss/ui/next";
import { RoomList } from "./list/room-list";
import { RoomHistorySearch } from "./search/room-history-search";
import { useRoomHistorySearchShortcut } from "./search/use-room-history-search-shortcut";

/** Props for {@link RoomHistory}. */
interface RoomHistoryProps {
	/** The room open now, marked in the list. */
	activeRoomId?: string;
	/** Whether each room shows its date. Default: false. */
	hasRoomDates?: boolean;
}

/**
 * The user's rooms and the search across them, opened from the list or with
 * Cmd+K (Ctrl+K elsewhere). Place it in the navigation's `Sidebar`: the list
 * loads and pages only while the sidebar shows.
 */
export const RoomHistory = ({
	activeRoomId,
	hasRoomDates = false,
}: RoomHistoryProps) => {
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	// on a phone the sidebar is a sheet that mounts hidden with no height, so
	// the list waits for it to open before it pages
	const { open, openMobile, isMobile } = useSidebar();
	useRoomHistorySearchShortcut(setIsSearchOpen);

	return (
		<>
			<RoomList
				isVisible={isMobile ? openMobile : open}
				activeRoomId={activeRoomId}
				hasRoomDates={hasRoomDates}
				onOpenSearch={() => setIsSearchOpen(true)}
			/>
			<RoomHistorySearch
				open={isSearchOpen}
				onOpenChange={setIsSearchOpen}
			/>
		</>
	);
};
