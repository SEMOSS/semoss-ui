import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useCollaborationWorkbenchLayout } from "./use-collaboration-workbench-layout";

class LayoutResizeObserver implements ResizeObserver {
	readonly observe = vi.fn();
	readonly unobserve = vi.fn();
	readonly disconnect = vi.fn();
	readonly notify: () => void;

	constructor(callback: ResizeObserverCallback) {
		this.notify = () => callback([], this);
		observers.push(this);
	}
}

const observers: LayoutResizeObserver[] = [];

beforeEach(() => {
	observers.length = 0;
	vi.stubGlobal("ResizeObserver", LayoutResizeObserver);
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

/** Supply real DOM refs while controlling geometry unavailable in jsdom. */
function renderLayout() {
	const dimensions = { width: 480, height: 56 };
	const content = document.createElement("div");
	const header = document.createElement("header");
	const conversation = document.createElement("div");
	content.append(header, conversation);
	vi.spyOn(conversation, "getBoundingClientRect").mockImplementation(
		() => new DOMRect(0, 0, dimensions.width, 800),
	);
	vi.spyOn(header, "getBoundingClientRect").mockImplementation(
		() => new DOMRect(0, 0, dimensions.width, dimensions.height),
	);
	let renderCount = 0;
	const view = renderHook(() => {
		renderCount += 1;
		return useCollaborationWorkbenchLayout();
	});
	view.result.current.contentRef.current = content;
	view.result.current.headerRef.current = header;
	return {
		...view,
		content,
		header,
		conversation,
		dimensions,
		getRenderCount: () => renderCount,
	};
}

it("tracks conversation width and wrapped header height without rerendering", () => {
	const view = renderLayout();
	act(() => {
		view.result.current.registerConversation(view.conversation);
	});
	expect(view.result.current.isWorkbenchLayoutActive).toBe(true);
	expect(
		view.content.style.getPropertyValue(
			"--collaboration-conversation-width",
		),
	).toBe("480px");
	expect(
		view.content.style.getPropertyValue("--collaboration-header-height"),
	).toBe("56px");
	const observer = observers[0];
	expect(observer?.observe).toHaveBeenCalledWith(view.conversation, {
		box: "border-box",
	});
	expect(observer?.observe).toHaveBeenCalledWith(view.header, {
		box: "border-box",
	});
	const renderCount = view.getRenderCount();
	view.dimensions.width = 280;
	view.dimensions.height = 100;
	act(() => observer?.notify());
	expect(
		view.content.style.getPropertyValue(
			"--collaboration-conversation-width",
		),
	).toBe("280px");
	expect(
		view.content.style.getPropertyValue("--collaboration-header-height"),
	).toBe("100px");
	expect(view.getRenderCount()).toBe(renderCount);

	view.dimensions.width = 0;
	act(() => observer?.notify());
	expect(
		view.content.style.getPropertyValue(
			"--collaboration-conversation-width",
		),
	).toBe("280px");
	view.dimensions.width = 520;
	act(() => observer?.notify());
	expect(
		view.content.style.getPropertyValue(
			"--collaboration-conversation-width",
		),
	).toBe("520px");
});

it("releases only the current registration and clears its measurements", () => {
	const view = renderLayout();
	let releaseFirst: () => void = () => undefined;
	let releaseCurrent: () => void = () => undefined;
	act(() => {
		releaseFirst = view.result.current.registerConversation(
			view.conversation,
		);
	});
	const firstObserver = observers[0];
	act(() => {
		releaseCurrent = view.result.current.registerConversation(
			view.conversation,
		);
	});
	expect(firstObserver?.disconnect).toHaveBeenCalledOnce();
	const currentObserver = observers[1];
	act(() => releaseFirst());
	expect(view.result.current.isWorkbenchLayoutActive).toBe(true);
	expect(currentObserver?.disconnect).not.toHaveBeenCalled();
	act(() => releaseCurrent());
	expect(view.result.current.isWorkbenchLayoutActive).toBe(false);
	expect(currentObserver?.disconnect).toHaveBeenCalledOnce();
	expect(
		view.content.style.getPropertyValue(
			"--collaboration-conversation-width",
		),
	).toBe("");
	expect(
		view.content.style.getPropertyValue("--collaboration-header-height"),
	).toBe("");
});

it("disconnects measurements when the shell unmounts", () => {
	const view = renderLayout();
	act(() => {
		view.result.current.registerConversation(view.conversation);
	});
	const observer = observers[0];
	view.unmount();
	expect(observer?.disconnect).toHaveBeenCalledOnce();
	expect(view.content.style.length).toBe(0);
});
