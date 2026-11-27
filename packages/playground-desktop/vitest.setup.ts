import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// main-process and contract tests run in node; only the renderer's get a DOM
if (typeof window !== "undefined") {
	// jsdom has no ResizeObserver or matchMedia; the chat's layout reads both
	globalThis.ResizeObserver = class {
		observe = vi.fn();
		unobserve = vi.fn();
		disconnect = vi.fn();
	};
	window.matchMedia ??= vi.fn((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
}
