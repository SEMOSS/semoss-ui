import { afterEach, expect, test, vi } from "vitest";
import {
	installTitleBarDragging,
	isTitleBarPress,
	TITLE_BAR_ATTRIBUTE,
} from "./window-chrome";

/** The element and its ancestors, innermost first, as a press reports them. */
const pathOf = (element: Element): EventTarget[] => {
	const path: EventTarget[] = [];
	for (let node: Element | null = element; node; node = node.parentElement) {
		path.push(node);
	}
	return [...path, document, window];
};

const renderHeader = () => {
	document.body.innerHTML = `
		<div ${TITLE_BAR_ATTRIBUTE}><span id="sidebar-top">Sidebar</span></div>
		<header>
			<span id="title">A room</span>
			<button id="more"><svg id="icon"></svg></button>
			<div role="menuitem" id="item"><span id="item-label">Item</span></div>
		</header>
		<p id="message">A message</p>
	`;
	const byId = (id: string) => {
		const element = document.getElementById(id);
		if (!element) {
			throw new Error(`#${id} is missing`);
		}
		return element;
	};
	return byId;
};

afterEach(() => {
	document.body.innerHTML = "";
	delete (window as { __TAURI__?: unknown }).__TAURI__;
});

test("a header and the app's title bar chrome drag the window, at the top only", () => {
	const byId = renderHeader();
	expect(isTitleBarPress(pathOf(byId("title")), 20)).toBe(true);
	expect(isTitleBarPress(pathOf(byId("sidebar-top")), 20)).toBe(true);
	// the same header, lower than the band
	expect(isTitleBarPress(pathOf(byId("title")), 60)).toBe(false);
	// not part of any title bar
	expect(isTitleBarPress(pathOf(byId("message")), 20)).toBe(false);
});

test("the controls in a header keep their presses", () => {
	const byId = renderHeader();
	expect(isTitleBarPress(pathOf(byId("more")), 20)).toBe(false);
	expect(isTitleBarPress(pathOf(byId("icon")), 20)).toBe(false);
	expect(isTitleBarPress(pathOf(byId("item-label")), 20)).toBe(false);
});

test("pressing the title bar drags the window; a still double click zooms it", () => {
	const byId = renderHeader();
	const appWindow = {
		startDragging: vi.fn().mockResolvedValue(undefined),
		toggleMaximize: vi.fn().mockResolvedValue(undefined),
	};
	(window as { __TAURI__?: unknown }).__TAURI__ = {
		window: { getCurrentWindow: () => appWindow },
	};
	const stop = installTitleBarDragging();
	const title = byId("title");
	const press = (type: string, detail: number, clientX = 100) =>
		title.dispatchEvent(
			new MouseEvent(type, {
				bubbles: true,
				cancelable: true,
				button: 0,
				detail: detail,
				clientX: clientX,
				clientY: 20,
			}),
		);

	press("mousedown", 1);
	press("mouseup", 1);
	expect(appWindow.startDragging).toHaveBeenCalledTimes(1);

	press("mousedown", 2);
	press("mouseup", 2);
	expect(appWindow.toggleMaximize).toHaveBeenCalledTimes(1);

	// the pointer moved between the second press and its release
	press("mousedown", 2);
	press("mouseup", 2, 140);
	expect(appWindow.toggleMaximize).toHaveBeenCalledTimes(1);

	// a control in the header is just a control
	byId("more").dispatchEvent(
		new MouseEvent("mousedown", {
			bubbles: true,
			button: 0,
			detail: 1,
			clientY: 20,
		}),
	);
	expect(appWindow.startDragging).toHaveBeenCalledTimes(1);

	stop();
	press("mousedown", 1);
	expect(appWindow.startDragging).toHaveBeenCalledTimes(1);
});
