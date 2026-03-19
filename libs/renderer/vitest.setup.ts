import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock monaco-editor to avoid complex ESM and worker issues in tests
vi.mock("monaco-editor", () => ({
	editor: {
		create: vi.fn(),
		defineTheme: vi.fn(),
		setTheme: vi.fn(),
	},
	languages: {
		register: vi.fn(),
		setLanguageConfiguration: vi.fn(),
		setMonarchTokensProvider: vi.fn(),
	},
}));

vi.mock(import("@semoss/ui"), async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		styled: vi.fn((component) => vi.fn(() => component)),
		useNotification: () => ({
			notifications: [],
			add: vi.fn(),
			remove: vi.fn(),
			close: vi.fn(),
		}),
	};
});

// Mock vega packages to avoid ESM issues in tests
vi.mock("vega-embed", () => ({
	default: vi.fn(() => Promise.resolve({ view: {} })),
	embed: vi.fn(() => Promise.resolve({ view: {} })),
}));

vi.mock("vega", () => ({
	default: {},
	View: vi.fn(),
	parse: vi.fn(),
	loader: vi.fn(),
}));

vi.mock("vega-lite", () => ({
	default: {},
	compile: vi.fn(),
}));

vi.mock("react-vega", () => ({
	VegaLite: vi.fn(() => null),
	Vega: vi.fn(() => null),
	createClassFromSpec: vi.fn(() => vi.fn(() => null)),
}));

vi.mock("echarts-wordcloud", () => ({
	isSupported: true,
	wordCloudLayoutHelper: {
		isSupported: true,
	},
	default: {
		layout: () => ({ run: () => [] }),
	},
}));

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

// Mock deprecated document.queryCommandSupported for Monaco Editor
Object.defineProperty(document, "queryCommandSupported", {
	value: vi.fn(() => true),
	writable: true,
});
