import { useEffect } from "react";

/** Routes vendor file commands through the panel's persistence and download UI. */
export const useOfficeFileCommands = (
	element: HTMLElement | null,
	onSave: () => void,
): void => {
	useEffect(() => {
		if (!element) return;
		const handleFileCommand = (event: Event) => {
			if (!(event instanceof CustomEvent)) return;
			const detail: unknown = event.detail;
			if (
				typeof detail !== "object" ||
				detail === null ||
				!("command" in detail) ||
				typeof detail.command !== "string"
			) {
				return;
			}
			// The host owns file lifecycle. Never let a vendor command replace the
			// loaded resource or download an alternate copy behind the panel.
			event.preventDefault();
			if (detail.command === "save") onSave();
		};
		element.addEventListener("file-command", handleFileCommand);
		const handleSaveShortcut = (event: KeyboardEvent) => {
			if (
				(event.ctrlKey || event.metaKey) &&
				!event.altKey &&
				!event.shiftKey &&
				event.key.toLowerCase() === "s"
			) {
				event.preventDefault();
				event.stopPropagation();
				onSave();
			}
		};
		element.addEventListener("keydown", handleSaveShortcut, true);
		return () => {
			element.removeEventListener("file-command", handleFileCommand);
			element.removeEventListener("keydown", handleSaveShortcut, true);
		};
	}, [element, onSave]);
};
