import "@testing-library/jest-dom";
import { vi } from "vitest";

// jsdom doesn't implement ResizeObserver — use a class so it works as a constructor
global.ResizeObserver = class {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
};

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
	fillRect: vi.fn(),
	clearRect: vi.fn(),
	getImageData: vi.fn(() => ({
		data: new Array(4),
	})),
	putImageData: vi.fn(),
	createImageData: vi.fn(() => ({})),
	setTransform: vi.fn(),
	drawImage: vi.fn(),
	save: vi.fn(),
	fillText: vi.fn(),
	restore: vi.fn(),
	beginPath: vi.fn(),
	moveTo: vi.fn(),
	lineTo: vi.fn(),
	closePath: vi.fn(),
	stroke: vi.fn(),
	translate: vi.fn(),
	scale: vi.fn(),
	rotate: vi.fn(),
	arc: vi.fn(),
	fill: vi.fn(),
	measureText: vi.fn(() => ({ width: 0 })),
	transform: vi.fn(),
	rect: vi.fn(),
	clip: vi.fn(),
	// biome-ignore lint/suspicious/noExplicitAny: <needed for testing>
})) as any;

// Chat UI reads its copy through i18next; tests read the keys instead. A
// test that needs real copy or another shape mocks "@semoss/i18n" itself.
vi.mock("@semoss/i18n", async (original) => ({
	...(await original<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: (key: string) => key }),
	getI18n: () => ({ t: (key: string) => key }),
}));
