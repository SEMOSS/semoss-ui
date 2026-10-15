import "@testing-library/jest-dom/vitest";

class TestResizeObserver implements ResizeObserver {
	disconnect() {}
	observe() {}
	unobserve() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
	configurable: true,
	value: TestResizeObserver,
});

class TestClipboardEvent extends Event {
	readonly clipboardData: DataTransfer | null;

	constructor(
		type: string,
		init?: EventInit & { clipboardData?: DataTransfer },
	) {
		super(type, init);
		this.clipboardData = init?.clipboardData ?? null;
	}
}

Object.defineProperty(globalThis, "ClipboardEvent", {
	configurable: true,
	value: TestClipboardEvent,
});

Object.defineProperty(Range.prototype, "getBoundingClientRect", {
	configurable: true,
	value: () => new DOMRect(),
});
Object.defineProperty(Range.prototype, "getClientRects", {
	configurable: true,
	value: () => ({
		item: () => null,
		length: 0,
		[Symbol.iterator]: function* () {},
	}),
});

Object.defineProperty(Element.prototype, "scrollIntoView", {
	configurable: true,
	value: () => undefined,
});
