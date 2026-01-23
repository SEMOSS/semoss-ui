import { useCallback, useEffect } from "react";

interface KeyboardShortcutHandlers {
	onOptimize?: () => void;
	onUndo?: () => void;
	onRedo?: () => void;
	onToggleAssist?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers) => {
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
			const modKey = isMac ? event.metaKey : event.ctrlKey;

			// Cmd/Ctrl + Shift + O - Optimize
			if (modKey && event.shiftKey && event.key.toLowerCase() === "o") {
				event.preventDefault();
				handlers.onOptimize?.();
				return;
			}

			// Cmd/Ctrl + Z - Undo
			if (modKey && !event.shiftKey && event.key.toLowerCase() === "z") {
				event.preventDefault();
				handlers.onUndo?.();
				return;
			}

			// Cmd/Ctrl + Shift + Z - Redo
			if (modKey && event.shiftKey && event.key.toLowerCase() === "z") {
				event.preventDefault();
				handlers.onRedo?.();
				return;
			}

			// Cmd/Ctrl + Shift + P - Toggle PromptAssist
			if (modKey && event.shiftKey && event.key.toLowerCase() === "p") {
				event.preventDefault();
				handlers.onToggleAssist?.();
				return;
			}
		},
		[handlers],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);
};
