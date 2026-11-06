import { isTauriRuntime, requireTauri } from "./tauri";

/**
 * The height of the window's title bar band: the rooms' header (`md:h-11`),
 * which the sidebar's top matches and the window's controls sit in.
 */
const TITLE_BAR_HEIGHT_PX = 44;

/** Marks app chrome in the title bar band that drags the window. */
export const TITLE_BAR_ATTRIBUTE = "data-title-bar";

// What Tauri's own drag regions treat as a control (`drag.js`), plus the
// roles a press must reach rather than move the window
const CONTROL_TAGS = new Set([
	"A",
	"BUTTON",
	"INPUT",
	"SELECT",
	"TEXTAREA",
	"LABEL",
	"SUMMARY",
]);
const CONTROL_ROLES = new Set([
	"button",
	"link",
	"menuitem",
	"tab",
	"checkbox",
	"radio",
	"switch",
	"option",
	"combobox",
	"textbox",
	"slider",
]);

const isControl = (element: HTMLElement): boolean =>
	CONTROL_TAGS.has(element.tagName) ||
	element.isContentEditable ||
	(element.hasAttribute("tabindex") &&
		element.getAttribute("tabindex") !== "-1") ||
	CONTROL_ROLES.has(element.getAttribute("role") ?? "");

/**
 * Whether the app runs on macOS, where shortcuts use ⌘ rather than Ctrl.
 *
 * @returns True on a Mac.
 */
export const isMacOS = (): boolean => /Mac/.test(navigator.userAgent);

/**
 * Whether the window's own title bar is hidden and its controls float over
 * the page (`titleBarStyle: "Overlay"`, which only macOS has), so the page
 * keeps clear of them and is the title bar itself.
 *
 * @returns True in the desktop app on macOS.
 */
export const hasOverlayTitleBar = (): boolean => isTauriRuntime() && isMacOS();

/**
 * Whether a press is on the title bar: in the band at the top of the window,
 * on a header or the app's own title bar chrome, and not on a control inside
 * it. Menus and dialogs render outside both, so they never move the window.
 *
 * @param path - The press's composed path, innermost first.
 * @param clientY - How far down the window it landed.
 * @returns True when it should drag the window.
 */
export const isTitleBarPress = (
	path: readonly EventTarget[],
	clientY: number,
): boolean => {
	if (clientY >= TITLE_BAR_HEIGHT_PX) {
		return false;
	}
	for (const target of path) {
		if (!(target instanceof HTMLElement)) {
			continue;
		}
		if (isControl(target)) {
			return false;
		}
		if (
			target.tagName === "HEADER" ||
			target.hasAttribute(TITLE_BAR_ATTRIBUTE)
		) {
			return true;
		}
	}
	return false;
};

/**
 * Make the top of the page behave as the title bar it covers: pressing a
 * header (or the sidebar's top) drags the window, and a double click zooms
 * it. Tauri's `data-tauri-drag-region` only works on elements that carry it,
 * and the chat's headers are not the app's to mark, so the title bar is found
 * by where the press lands instead.
 *
 * As on macOS, the zoom happens on the second release, and not if the
 * pointer moved in between.
 *
 * @returns Stops listening.
 */
export const installTitleBarDragging = (): (() => void) => {
	const appWindow = requireTauri().window.getCurrentWindow();
	let doubleClickAt: { x: number; y: number } | null = null;

	const handleMouseDown = (event: MouseEvent) => {
		if (
			event.button !== 0 ||
			!isTitleBarPress(event.composedPath(), event.clientY)
		) {
			return;
		}
		if (event.detail === 2) {
			doubleClickAt = { x: event.clientX, y: event.clientY };
			return;
		}
		if (event.detail === 1) {
			// no text cursor or selection while the window moves
			event.preventDefault();
			void appWindow.startDragging().catch(() => undefined);
		}
	};

	const handleMouseUp = (event: MouseEvent) => {
		const pressedAt = doubleClickAt;
		doubleClickAt = null;
		if (
			event.button === 0 &&
			event.detail === 2 &&
			pressedAt?.x === event.clientX &&
			pressedAt.y === event.clientY &&
			isTitleBarPress(event.composedPath(), event.clientY)
		) {
			void appWindow.toggleMaximize().catch(() => undefined);
		}
	};

	document.addEventListener("mousedown", handleMouseDown);
	document.addEventListener("mouseup", handleMouseUp);
	return () => {
		document.removeEventListener("mousedown", handleMouseDown);
		document.removeEventListener("mouseup", handleMouseUp);
	};
};
