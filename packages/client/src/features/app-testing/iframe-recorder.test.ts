import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppTestStep } from "./app-test.types";
import {
	appendRecordedStep,
	attachIframeRecorder,
	isStableSelector,
} from "./iframe-recorder";

const stopRecorders: (() => void)[] = [];
afterEach(() => {
	for (const stop of stopRecorders.splice(0)) stop();
	document.body.replaceChildren();
});

const setup = (html: string) => {
	const frame = document.createElement("iframe");
	document.body.append(frame);
	const doc = frame.contentDocument;
	if (!doc) throw new Error("Test iframe has no document");
	doc.body.innerHTML = html;
	let steps: AppTestStep[] = [];
	const notice = vi.fn();
	const recorder = attachIframeRecorder(
		frame,
		(step) => {
			steps = appendRecordedStep(steps, step);
		},
		notice,
	);
	stopRecorders.push(recorder.stop);
	return { frame, doc, notice, recorder, steps: () => steps };
};

const element = <T extends Element>(doc: Document, selector: string): T => {
	const found = doc.querySelector<T>(selector);
	if (!found) throw new Error(`Missing test element ${selector}`);
	return found;
};

describe("stable targets", () => {
	it("accepts only data-testid selectors", () => {
		expect(isStableSelector('button[data-testid="button-7"]')).toBe(true);
		expect(isStableSelector('[data-test="save"]')).toBe(true);
		expect(isStableSelector('input[id="query"]')).toBe(false);
		expect(isStableSelector("div > button:nth-of-type(2)")).toBe(false);
		expect(isStableSelector('button[data-testid="a"] span')).toBe(false);
	});

	it("warns once per fragile selector and never for a test id", () => {
		const state = setup(
			'<button id="plain">Plain</button><button data-testid="ok">Ok</button>',
		);
		element<HTMLButtonElement>(state.doc, "#plain").click();
		element<HTMLButtonElement>(state.doc, "#plain").click();
		element<HTMLButtonElement>(state.doc, '[data-testid="ok"]').click();
		expect(state.notice).toHaveBeenCalledTimes(1);
		expect(state.notice).toHaveBeenCalledWith(
			expect.stringContaining("data-testid"),
		);
	});

	it("does not record scroll positions", () => {
		const state = setup(
			'<div id="list" style="overflow:auto;height:10px"><p>a</p><p>b</p></div>',
		);
		const list = element<HTMLElement>(state.doc, "#list");
		list.scrollTop = 5;
		list.dispatchEvent(new Event("scroll"));
		expect(state.steps()).toEqual([]);
	});
});

describe("normal app iframe recording", () => {
	it("captures inner-document events that do not bubble to the SEMOSS document", () => {
		const state = setup(
			'<input id="query"><button data-testid="submit">Submit</button>',
		);
		const outerClick = vi.fn();
		document.addEventListener("click", outerClick, { once: true });
		const button = element<HTMLButtonElement>(state.doc, "button");
		const activate = vi.fn();
		button.addEventListener("click", activate);
		const input = element<HTMLInputElement>(state.doc, "input");
		for (const value of ["a", "app"]) {
			input.value = value;
			input.dispatchEvent(new Event("input", { bubbles: true }));
		}
		button.click();
		input.dispatchEvent(new Event("change", { bubbles: true }));
		expect(outerClick).not.toHaveBeenCalled();
		document.removeEventListener("click", outerClick);
		expect(activate).toHaveBeenCalledTimes(1);
		expect(state.steps()).toEqual([
			{
				type: "FILL",
				selector: 'input[id="query"]',
				value: "app",
				framePath: [],
			},
			{
				type: "CLICK",
				selector: 'button[data-testid="submit"]',
				framePath: [],
			},
		]);
	});

	it("never serializes password, secret, or explicitly private fields", () => {
		const state = setup(
			'<input type="password"><input name="api_key"><div data-private><input id="private"></div>',
		);
		for (const input of state.doc.querySelectorAll("input")) {
			input.value = "do-not-save";
			input.dispatchEvent(new Event("input", { bubbles: true }));
		}
		expect(state.steps()).toEqual([]);
		expect(JSON.stringify(state.notice.mock.calls)).not.toContain(
			"do-not-save",
		);
		expect(state.notice).toHaveBeenCalled();
	});

	it("records input buttons while leaving editable field clicks out", () => {
		const state = setup(
			'<input id="name"><input type="button" id="action" value="Run">',
		);
		element<HTMLInputElement>(state.doc, "#name").click();
		element<HTMLInputElement>(state.doc, "#action").click();
		expect(state.steps()).toEqual([
			{ type: "CLICK", selector: 'input[id="action"]', framePath: [] },
		]);
	});

	it("adds an outcome check without activating the selected app control", () => {
		const state = setup('<button id="confirm">Order confirmed</button>');
		const button = element<HTMLButtonElement>(state.doc, "button");
		const activate = vi.fn();
		button.addEventListener("click", activate);
		button.addEventListener("mousedown", activate);
		state.recorder.addCheck();
		button.dispatchEvent(
			new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
		);
		button.click();
		expect(activate).not.toHaveBeenCalled();
		expect(state.steps()).toEqual([
			{
				type: "ASSERT_TEXT",
				selector: 'button[id="confirm"]',
				text: "Order confirmed",
				exact: true,
				framePath: [],
			},
		]);
		button.click();
		expect(activate).toHaveBeenCalledTimes(1);
		expect(state.steps().at(-1)?.type).toBe("CLICK");
	});

	it("captures checkboxes and selects as state changes, not duplicate clicks", () => {
		const state = setup(
			'<input id="enabled" type="checkbox"><select id="status"><option value="open">Open</option><option value="closed">Closed</option></select>',
		);
		element<HTMLInputElement>(state.doc, "input").click();
		const select = element<HTMLSelectElement>(state.doc, "select");
		select.value = "closed";
		select.dispatchEvent(new Event("input", { bubbles: true }));
		select.dispatchEvent(new Event("change", { bubbles: true }));
		expect(state.steps()).toEqual([
			{
				type: "CHECK",
				selector: 'input[id="enabled"]',
				checked: true,
				framePath: [],
			},
			{
				type: "SELECT",
				selector: 'select[id="status"]',
				value: "closed",
				framePath: [],
			},
		]);
	});

	it("supports keyboard checkpoint selection and Escape cancellation without app activation", () => {
		const state = setup('<button id="ready">Ready</button>');
		const button = element<HTMLButtonElement>(state.doc, "button");
		const activate = vi.fn();
		button.addEventListener("keydown", activate);
		state.recorder.addCheck();
		button.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "Escape",
				bubbles: true,
				cancelable: true,
			}),
		);
		expect(state.steps()).toEqual([]);
		expect(activate).not.toHaveBeenCalled();
		state.recorder.addCheck();
		button.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "Enter",
				bubbles: true,
				cancelable: true,
			}),
		);
		expect(state.steps()).toEqual([
			{
				type: "ASSERT_TEXT",
				selector: 'button[id="ready"]',
				text: "Ready",
				exact: true,
				framePath: [],
			},
		]);
		expect(activate).not.toHaveBeenCalled();
	});

	it("records dynamic same-origin nested frames with their frame path", async () => {
		const state = setup("<div>App</div>");
		const nested = state.doc.createElement("iframe");
		nested.id = "nested";
		state.doc.body.append(nested);
		await new Promise((resolve) => setTimeout(resolve, 0));
		const child = nested.contentDocument;
		if (!child) throw new Error("Nested test frame has no document");
		child.body.innerHTML = '<button id="inside">Inside</button>';
		element<HTMLButtonElement>(child, "button").click();
		expect(state.steps()).toEqual([
			{
				type: "CLICK",
				selector: 'button[id="inside"]',
				framePath: ['iframe[id="nested"]'],
			},
		]);
	});

	it("reattaches on navigation once, releases old documents, and stops cleanly", () => {
		const state = setup('<button id="old">Old</button>');
		const replacement =
			document.implementation.createHTMLDocument("Next page");
		replacement.body.innerHTML = '<button id="new">New</button>';
		Object.defineProperty(state.frame, "contentDocument", {
			configurable: true,
			value: replacement,
		});
		state.frame.dispatchEvent(new Event("load"));
		state.frame.dispatchEvent(new Event("load"));
		element<HTMLButtonElement>(state.doc, "button").click();
		element<HTMLButtonElement>(replacement, "button").click();
		expect(state.steps()).toHaveLength(1);
		expect(state.steps()[0].selector).toBe('button[id="new"]');
		state.recorder.stop();
		element<HTMLButtonElement>(replacement, "button").click();
		expect(state.steps()).toHaveLength(1);
	});

	it("reports inaccessible documents rather than pretending to record", () => {
		const state = setup("<p>App</p>");
		Object.defineProperty(state.frame, "contentDocument", {
			configurable: true,
			value: null,
		});
		state.frame.dispatchEvent(new Event("load"));
		expect(state.notice).toHaveBeenCalledWith(
			expect.stringContaining("inaccessible"),
		);
		expect(state.steps()).toEqual([]);
	});

	it("does not follow a root iframe into another app's portal", () => {
		const state = setup('<button id="old">Old</button>');
		const outside = document.implementation.createHTMLDocument("Other app");
		outside.body.innerHTML = '<button id="other">Other</button>';
		Object.defineProperty(outside, "URL", {
			value: "https://semoss.example/Monolith/public_home/other/portals/",
		});
		Object.defineProperty(state.frame, "src", {
			value: "https://semoss.example/Monolith/public_home/app/portals/",
		});
		Object.defineProperty(state.frame, "contentDocument", {
			configurable: true,
			value: outside,
		});
		state.frame.dispatchEvent(new Event("load"));
		element<HTMLButtonElement>(outside, "button").click();
		element<HTMLButtonElement>(state.doc, "button").click();
		expect(state.steps()).toEqual([]);
		expect(state.notice).toHaveBeenCalledWith(
			expect.stringContaining("outside its portal"),
		);
	});

	it("captures open-shadow controls with selectors rooted at their host", () => {
		const state = setup('<div id="widget"></div>');
		const shadow = element(state.doc, "div").attachShadow({ mode: "open" });
		shadow.innerHTML = '<button id="shadow-action">Action</button>';
		const button = shadow.querySelector("button");
		if (!button) throw new Error("Shadow button missing");
		button.dispatchEvent(
			new MouseEvent("click", { bubbles: true, composed: true }),
		);
		expect(state.steps()[0].selector).toBe(
			'div[id="widget"] button[id="shadow-action"]',
		);
	});
});

describe("multi-page recording", () => {
	it("keeps actions on identical fields separate across query and hash routes", () => {
		const state = setup('<input data-testid="name">');
		Object.defineProperty(state.frame, "src", {
			value: "https://semoss.example/Monolith/public_home/app/portals/",
		});
		let url =
			"https://semoss.example/Monolith/public_home/app/portals/orders?state=new#/edit";
		Object.defineProperty(state.doc, "URL", {
			configurable: true,
			get: () => url,
		});
		const field = element<HTMLInputElement>(state.doc, "input");
		field.value = "First page";
		field.dispatchEvent(new Event("input", { bubbles: true }));
		url =
			"https://semoss.example/Monolith/public_home/app/portals/orders?state=ready#/review";
		field.value = "Second page";
		field.dispatchEvent(new Event("input", { bubbles: true }));
		expect(state.steps().map((step) => step.pagePath)).toEqual([
			"orders?state=new#/edit",
			"orders?state=ready#/review",
		]);
	});
	it("tags actions on replacement documents with the new page and retains the original click", () => {
		const state = setup('<a data-testid="next">Next</a>');
		const root = "https://semoss.example/Monolith/public_home/app/portals/";
		Object.defineProperty(state.frame, "src", { value: root });
		Object.defineProperty(state.doc, "URL", { value: root });
		element<HTMLElement>(state.doc, "a").click();
		const next = document.implementation.createHTMLDocument("Details");
		next.body.innerHTML = '<p data-testid="result">Saved</p>';
		Object.defineProperty(next, "URL", { value: `${root}details.html` });
		Object.defineProperty(state.frame, "contentDocument", {
			configurable: true,
			value: next,
		});
		state.frame.dispatchEvent(new Event("load"));
		state.recorder.addCheck();
		element<HTMLElement>(next, "p").click();
		expect(
			state
				.steps()
				.map((step) => ({ type: step.type, pagePath: step.pagePath })),
		).toEqual([
			{ type: "CLICK", pagePath: "" },
			{ type: "ASSERT_TEXT", pagePath: "details.html" },
		]);
	});
});

describe("meaningful form and drag checks", () => {
	it("records selected/input values and checkbox state instead of option labels or visibility", async () => {
		const state = setup(
			'<select data-testid="lane"><option value="ready">Ready</option><option value="progress" selected>In Progress</option></select><input data-testid="title" value="Saved task"><input type="checkbox" data-testid="done" checked>',
		);
		for (const selector of [
			"select",
			'input[data-testid="title"]',
			'input[data-testid="done"]',
		]) {
			state.recorder.addCheck();
			element<HTMLElement>(state.doc, selector).click();
		}
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(state.steps()).toMatchObject([
			{ type: "ASSERT_VALUE", value: "progress" },
			{ type: "ASSERT_VALUE", value: "Saved task" },
			{ type: "ASSERT_CHECKED", checked: true },
		]);
		expect(JSON.stringify(state.steps())).not.toContain("ReadyIn Progress");
	});
	it("records a native drag in the same app document and releases listeners on stop", () => {
		const state = setup(
			'<div draggable="true" data-testid="source">Task</div><div data-testid="destination">Lane</div>',
		);
		element(state.doc, '[data-testid="source"]').dispatchEvent(
			new Event("dragstart", { bubbles: true }),
		);
		element(state.doc, '[data-testid="destination"]').dispatchEvent(
			new Event("drop", { bubbles: true }),
		);
		expect(state.steps()).toMatchObject([
			{
				type: "DRAG",
				selector: 'div[data-testid="source"]',
				targetSelector: 'div[data-testid="destination"]',
			},
		]);
		state.recorder.stop();
		element(state.doc, '[data-testid="source"]').dispatchEvent(
			new Event("dragstart", { bubbles: true }),
		);
		element(state.doc, '[data-testid="destination"]').dispatchEvent(
			new Event("drop", { bubbles: true }),
		);
		expect(state.steps()).toHaveLength(1);
	});
});
