import { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ConnectorFocusRequest } from "./connector.types";
import { useConnectorFocus } from "./use-connector-focus";

interface HarnessProps {
	request?: ConnectorFocusRequest;
	isVisible?: boolean;
	canFocus?: boolean;
}

const Harness = ({
	request,
	isVisible = true,
	canFocus = false,
}: HarnessProps) => {
	const listRef = useRef<HTMLUListElement>(null);
	useConnectorFocus(listRef, request, isVisible);
	return (
		<ul ref={listRef} tabIndex={-1} data-can-focus={canFocus}>
			{["first", "second"].map((key) => (
				<li key={key}>
					<button
						type="button"
						data-item-key={key}
						data-can-focus={canFocus}
					>
						{key}
					</button>
				</li>
			))}
		</ul>
	);
};

let root: Root;
let container: HTMLDivElement;
let frames: Map<number, FrameRequestCallback>;
let frameId = 0;
const nativeFocus = HTMLElement.prototype.focus;
const render = async (props: HarnessProps) => {
	await act(async () => root.render(<Harness {...props} />));
};
const nextFrame = async () => {
	const callbacks = [...frames.values()];
	frames.clear();
	await act(async () => {
		for (const callback of callbacks) callback(0);
	});
};

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	frames = new Map();
	frameId = 0;
	vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
		frames.set(++frameId, callback);
		return frameId;
	});
	vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
	vi.spyOn(HTMLElement.prototype, "focus").mockImplementation(function (
		this: HTMLElement,
		options?: FocusOptions,
	) {
		if (this.dataset.canFocus !== "false") nativeFocus.call(this, options);
	});
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it("retries after dock layout reveals the list and only handles successful focus", async () => {
	const request = { itemKey: "", requestId: 1 };
	await render({ request });
	const list = container.querySelector("ul");
	expect(document.activeElement).not.toBe(list);
	await nextFrame();
	await render({ request, canFocus: true });
	await nextFrame();
	expect(document.activeElement).toBe(list);
	expect(frames.size).toBe(0);
	container.querySelector("button")?.focus();
	await render({ request, canFocus: true });
	expect(document.activeElement).not.toBe(list);
});

it("cancels retries while hidden and retries the unhandled request on return", async () => {
	const request = { itemKey: "first", requestId: 1 };
	await render({ request });
	expect(frames.size).toBe(1);
	await render({ request, isVisible: false });
	expect(frames.size).toBe(0);
	await render({ request, canFocus: true });
	expect(document.activeElement).toBe(
		container.querySelector('[data-item-key="first"]'),
	);
});

it("cancels a previous request when another item becomes the focus target", async () => {
	await render({ request: { itemKey: "first", requestId: 1 } });
	const staleFrame = [...frames.values()][0];
	await render({
		request: { itemKey: "second", requestId: 2 },
		canFocus: true,
	});
	staleFrame?.(0);
	expect(frames.size).toBe(0);
	expect(document.activeElement).toBe(
		container.querySelector('[data-item-key="second"]'),
	);
});

it("stops after two layout-frame retries and leaves a later request eligible", async () => {
	await render({ request: { itemKey: "", requestId: 1 } });
	await nextFrame();
	await nextFrame();
	expect(frames.size).toBe(0);
	expect(HTMLElement.prototype.focus).toHaveBeenCalledTimes(3);
	await render({ request: { itemKey: "", requestId: 2 }, canFocus: true });
	expect(document.activeElement).toBe(container.querySelector("ul"));
});
