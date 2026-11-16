import { useEffect } from "react";

/**
 * Open chat search on Cmd+K (Ctrl+K elsewhere), from anywhere in the page.
 *
 * @param onOpenChange - Opens the search, as `Chat.RoomSearch`'s `onOpenChange`; pass a stable
 * function, such as a state setter.
 * @param isEnabled - Whether the shortcut is on, as when the chat history is shown.
 */
export const useRoomSearchShortcut = (
	onOpenChange: (open: boolean) => void,
	isEnabled = true,
): void => {
	useEffect(() => {
		if (!isEnabled) {
			return;
		}
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
	}, [onOpenChange, isEnabled]);
};
