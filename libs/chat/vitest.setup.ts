import "@testing-library/jest-dom";
import { vi } from "vitest";

// jsdom doesn't implement scrollIntoView — MessageList calls it to
// auto-scroll to the latest message.
Element.prototype.scrollIntoView = vi.fn();

// jsdom doesn't implement canvas — importing @semoss/ui/next's barrel
// (for Button/Spinner) pulls in its Terminal component (xterm), which
// probes for a canvas context. Matches playground's own vitest.setup.ts
// mock for the same reason.
// biome-ignore lint/suspicious/noExplicitAny: <needed for testing>
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any;

// jsdom doesn't implement ResizeObserver — @semoss/ui/next's ScrollArea
// (used by RoomSidebar) observes its content size to show/hide the
// scrollbar thumb.
global.ResizeObserver =
	global.ResizeObserver ??
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};

// jsdom doesn't implement matchMedia — @semoss/ui/next's Code component
// (used by the markdown code-block renderer) checks it to resolve
// theme === "system" to an actual light/dark Shiki theme.
window.matchMedia =
	window.matchMedia ??
	((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	}));
