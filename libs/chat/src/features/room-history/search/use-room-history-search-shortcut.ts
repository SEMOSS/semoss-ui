import { useEffect } from "react";

/**
 * Open chat search on Cmd+K (Ctrl+K elsewhere), from anywhere in the page.
 *
 * @param onOpenChange - Opens the search, as `RoomHistorySearch`'s `onOpenChange`; pass a stable
 * function, such as a state setter.
 */
export const useRoomHistorySearchShortcut = (
	onOpenChange: (open: boolean) => void,
): void => {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.key.toLowerCase() === "k" &&
				(event.metaKey || event.ctrlKey) &&
				!event.altKey &&
				!event.shiftKey
			) {
				event.preventDefault();
				onOpenChange(true);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onOpenChange]);
};
