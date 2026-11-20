import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useStickToBottomScroll } from "./use-stick-to-bottom-scroll";

/** Every ResizeObserver the hook made, with what it watches. */
let observers: FakeResizeObserver[] = [];

/** A ResizeObserver a test reports sizes through by hand. */
class FakeResizeObserver {
	targets: Element[] = [];
	isConnected = true;
	constructor(private readonly callback: ResizeObserverCallback) {
		observers.push(this);
	}
	observe = (target: Element) => {
		this.targets.push(target);
	};
	unobserve = vi.fn();
	disconnect = () => {
		this.isConnected = false;
	};
	/** Report a resize, as the browser would. */
	resize = () => {
		if (this.isConnected) {
			this.callback([], this as unknown as ResizeObserver);
		}
	};
}

/** The observer that is watching now, if any. */
const liveObserver = () => observers.find((observer) => observer.isConnected);

/**
 * A viewport with scroll metrics a test sets, since jsdom lays nothing out.
 *
 * @returns The viewport, its metrics, and its scrollTo spy.
 */
const createViewport = () => {
	const element = document.createElement("div");
	const metrics = { scrollTop: 0, scrollHeight: 1000, clientHeight: 200 };
	Object.defineProperties(element, {
		scrollTop: {
			get: () => metrics.scrollTop,
			set: (value: number) => {
				metrics.scrollTop = value;
			},
		},
		scrollHeight: { get: () => metrics.scrollHeight },
		clientHeight: { get: () => metrics.clientHeight },
	});
	const scrollTo = vi.fn();
	element.scrollTo = scrollTo;
	return { element, metrics, scrollTo };
};

/**
 * Scroll the viewport, and let its once-a-frame read run.
 *
 * @param viewport - The viewport.
 * @param scrollTop - Where it scrolls to.
 */
const scrollViewport = (
	viewport: ReturnType<typeof createViewport>,
	scrollTop: number,
) => {
	act(() => {
		viewport.metrics.scrollTop = scrollTop;
		viewport.element.dispatchEvent(new Event("scroll"));
	});
};

beforeEach(() => {
	observers = [];
	vi.stubGlobal("ResizeObserver", FakeResizeObserver);
	// frames run at once, so each scroll lands before the assertion
	vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
		callback(0);
		return 1;
	});
	vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

/**
 * Mount the hook with its viewport and content attached.
 *
 * @param isStreaming - Whether a reply streams at first.
 * @returns The hook's result, a rerender, the viewport, and the scroll report spy.
 */
const mount = (isStreaming = false) => {
	const viewport = createViewport();
	const content = document.createElement("div");
	const onScrolledChange = vi.fn();
	const hook = renderHook(
		({ streaming }) => useStickToBottomScroll(streaming, onScrolledChange),
		{ initialProps: { streaming: isStreaming } },
	);
	act(() => {
		hook.result.current.viewportRef(viewport.element);
		hook.result.current.contentRef(content);
	});
	return { ...hook, viewport, content, onScrolledChange };
};

test("the view opens at the bottom", () => {
	const { result, viewport } = mount();

	expect(viewport.metrics.scrollTop).toBe(1000);
	expect(result.current.isAwayFromBottom).toBe(false);
	// a long way down, so the way back up is offered
	expect(result.current.isScrollUpShown).toBe(true);
});

test("scrolling shows the buttons, locks the view, and reports leaving the top", () => {
	const { result, viewport, onScrolledChange } = mount();

	// up near the top: 700px from the bottom, 100px from the top
	scrollViewport(viewport, 100);
	expect(result.current.isAwayFromBottom).toBe(true);
	expect(result.current.isScrollUpShown).toBe(false);
	expect(onScrolledChange).toHaveBeenLastCalledWith(true);

	// back within the threshold of the bottom
	scrollViewport(viewport, 700);
	expect(result.current.isAwayFromBottom).toBe(false);
	expect(result.current.isScrollUpShown).toBe(true);

	scrollViewport(viewport, 0);
	expect(onScrolledChange).toHaveBeenLastCalledWith(false);
});

test("while a reply streams, the view follows the content until the user scrolls away", () => {
	const { result, viewport, content } = mount(true);
	const observer = liveObserver();
	expect(observer?.targets).toEqual([content]);

	viewport.metrics.scrollHeight = 1500;
	act(() => observer?.resize());
	expect(viewport.metrics.scrollTop).toBe(1500);

	// the user scrolls up: growth no longer moves the view
	scrollViewport(viewport, 200);
	expect(result.current.isAwayFromBottom).toBe(true);
	expect(liveObserver()).toBeUndefined();
	viewport.metrics.scrollHeight = 2000;
	act(() => observer?.resize());
	expect(viewport.metrics.scrollTop).toBe(200);

	// back at the bottom, it follows again from where the content is
	scrollViewport(viewport, 1850);
	const resumed = liveObserver();
	expect(resumed).toBeDefined();
	viewport.metrics.scrollHeight = 2400;
	act(() => resumed?.resize());
	expect(viewport.metrics.scrollTop).toBe(2400);
});

test("nothing follows the content while no reply streams", () => {
	const { viewport } = mount(false);

	expect(liveObserver()).toBeUndefined();
	expect(viewport.metrics.scrollTop).toBe(1000);
});

test("a settling stream scrolls to the bottom once and unlocks the view", () => {
	const { result, rerender, viewport } = mount(true);
	scrollViewport(viewport, 100);
	expect(result.current.isAwayFromBottom).toBe(true);

	rerender({ streaming: false });
	expect(viewport.scrollTo).toHaveBeenCalledTimes(1);
	expect(viewport.scrollTo).toHaveBeenCalledWith({
		top: 1000,
		behavior: "smooth",
	});
	expect(result.current.isAwayFromBottom).toBe(false);

	// a settled view does not scroll again on the next render
	rerender({ streaming: false });
	expect(viewport.scrollTo).toHaveBeenCalledTimes(1);
});

test("the buttons scroll smoothly to the top and the bottom", () => {
	const { result, viewport } = mount();

	act(() => result.current.scrollToTop());
	expect(viewport.scrollTo).toHaveBeenLastCalledWith({
		top: 0,
		behavior: "smooth",
	});
	viewport.metrics.scrollHeight = 3000;
	act(() => result.current.scrollToBottom());
	expect(viewport.scrollTo).toHaveBeenLastCalledWith({
		top: 3000,
		behavior: "smooth",
	});
});

test("unmounting stops listening and observing", () => {
	const { unmount, viewport, onScrolledChange } = mount(true);
	const remove = vi.spyOn(viewport.element, "removeEventListener");

	unmount();
	expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
	expect(liveObserver()).toBeUndefined();
	onScrolledChange.mockClear();
	viewport.element.dispatchEvent(new Event("scroll"));
	expect(onScrolledChange).not.toHaveBeenCalled();
});
