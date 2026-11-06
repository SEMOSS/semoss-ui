import { useEffect } from "react";
import { isMacOS } from "../../platform/window-chrome";

/** What the app's keyboard shortcuts do. */
export interface DesktopShortcuts {
	/** ⌘N (Ctrl+N): start a new chat. */
	onNewChat: () => void;
	/** ⌘, (Ctrl+,): open settings. */
	onOpenSettings: () => void;
}

/**
 * How a shortcut reads in a menu or tooltip on this computer.
 *
 * @param key - The key pressed with ⌘ (Ctrl), as it is printed.
 * @returns Such as `⌘N` on a Mac, `Ctrl+N` elsewhere.
 */
export const formatShortcut = (key: string): string =>
	isMacOS() ? `⌘${key}` : `Ctrl+${key}`;

/**
 * The desktop app's own keyboard shortcuts, wherever focus is: ⌘N for a new
 * chat and ⌘, for settings (Ctrl off a Mac). ⌘B, which folds the sidebar,
 * comes with the sidebar itself. A dialog keeps its keys.
 *
 * @param shortcuts - What each shortcut does.
 */
export const useDesktopShortcuts = ({
	onNewChat,
	onOpenSettings,
}: DesktopShortcuts): void => {
	useEffect(() => {
		const isMac = isMacOS();
		const actions = new Map<string, () => void>([
			["n", onNewChat],
			[",", onOpenSettings],
		]);
		const handleKeyDown = (event: KeyboardEvent) => {
			const hasModifier = isMac
				? event.metaKey && !event.ctrlKey
				: event.ctrlKey && !event.metaKey;
			if (
				!hasModifier ||
				event.shiftKey ||
				event.altKey ||
				event.repeat ||
				event.isComposing
			) {
				return;
			}
			if (
				event.target instanceof Element &&
				event.target.closest('[role="dialog"], [role="alertdialog"]')
			) {
				return;
			}
			const action = actions.get(event.key.toLowerCase());
			if (action) {
				event.preventDefault();
				action();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onNewChat, onOpenSettings]);
};
