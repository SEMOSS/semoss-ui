import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HtmlPreview } from "./html-preview";
import {
	createHtmlPreviewDocument,
	HTML_PREVIEW_CHANNEL,
} from "./html-preview-document";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

function getFrame(title = "HTML Preview"): HTMLIFrameElement {
	const frame = screen.getByTitle(title);
	if (!(frame instanceof HTMLIFrameElement))
		throw new Error("Expected an iframe");
	return frame;
}

function getDocumentId(frame: HTMLIFrameElement): string {
	const id = /"id":"([^"]+)"/.exec(frame.srcdoc)?.[1];
	if (!id) throw new Error("Missing preview document identity");
	return id;
}

function sendMessage(
	frame: HTMLIFrameElement,
	data: Record<string, unknown>,
	options: MessageEventInit = {},
): void {
	act(() => {
		window.dispatchEvent(
			new MessageEvent("message", {
				origin: "null",
				source: frame.contentWindow,
				data: {
					channel: HTML_PREVIEW_CHANNEL,
					id: getDocumentId(frame),
					...data,
				},
				...options,
			}),
		);
	});
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe("HtmlPreview", () => {
	it("replaces HTML without a toolbar and keeps its document stable during feedback", () => {
		const html =
			'<main><button onclick="this.textContent = 2">1</button></main>';
		const { rerender } = render(<HtmlPreview html={html} />);
		const frame = getFrame();
		const source = frame.srcdoc;
		expect(source.endsWith(html)).toBe(true);
		expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
		expect(frame.getAttribute("referrerpolicy")).toBe("no-referrer");
		expect(screen.queryByRole("button")).toBeNull();
		fireEvent.load(frame);
		expect(frame.parentElement?.getAttribute("aria-busy")).toBe("true");
		sendMessage(frame, { type: "ready" });
		expect(frame.parentElement?.getAttribute("aria-busy")).toBe("false");
		expect(frame.srcdoc).toBe(source);

		rerender(<HtmlPreview html={"  \n "} />);
		expect(getFrame()).toBe(frame);
		expect(frame.srcdoc).not.toBe(source);
		expect(frame.srcdoc).toContain("<body></body>");
		expect(frame.parentElement?.getAttribute("aria-busy")).toBe("true");
	});

	it("rejects unrelated, malformed, and stale diagnostic messages", () => {
		const { rerender } = render(<HtmlPreview html="<p>First</p>" />);
		const frame = getFrame();
		const error = { type: "error", message: "Ignored" };
		sendMessage(frame, error, { source: window });
		sendMessage(frame, error, { origin: window.location.origin });
		sendMessage(frame, { ...error, channel: "other" });
		sendMessage(frame, {
			type: "error",
			message: { text: "Not a string" },
		});
		sendMessage(frame, { type: "unknown" });
		expect(screen.queryByRole("alert")).toBeNull();
		const oldId = getDocumentId(frame);
		rerender(<HtmlPreview html="<p>Second</p>" />);
		sendMessage(frame, { ...error, id: oldId });
		expect(screen.queryByRole("alert")).toBeNull();
		sendMessage(frame, {
			type: "error",
			message: "Current document failed",
		});
		expect(screen.getByRole("alert").textContent).toContain(
			"Current document failed",
		);
	});

	it("does not share messages or timers between previews and cleans up in Strict Mode", () => {
		const removeListener = vi.spyOn(window, "removeEventListener");
		const { unmount } = render(
			<StrictMode>
				<HtmlPreview title="First" html="<p>First</p>" />
				<HtmlPreview title="Second" html="<p>Second</p>" />
			</StrictMode>,
		);
		const first = getFrame("First");
		sendMessage(first, {
			type: "ready",
			id: getDocumentId(getFrame("Second")),
		});
		expect(first.parentElement?.getAttribute("aria-busy")).toBe("true");
		sendMessage(getFrame("Second"), {
			type: "error",
			message: "Second failed",
		});
		expect(screen.getByRole("alert").textContent).toContain(
			"Second failed",
		);
		expect(first.parentElement?.querySelector('[role="alert"]')).toBeNull();
		const lateMessage = new MessageEvent("message", {
			origin: "null",
			source: first.contentWindow,
			data: {
				channel: HTML_PREVIEW_CHANNEL,
				id: getDocumentId(first),
				type: "error",
				message: "Unmounted",
			},
		});
		unmount();
		act(() => window.dispatchEvent(lateMessage));
		expect(
			removeListener.mock.calls.filter(([type]) => type === "message"),
		).toHaveLength(4);
		expect(vi.getTimerCount()).toBe(0);
	});

	it("reports runtime errors as text, bounds diagnostics, and resets them for new HTML", () => {
		const { rerender } = render(<HtmlPreview html="<p>First</p>" />);
		const frame = getFrame();
		sendMessage(frame, {
			type: "error",
			message: `<img src=x>${"x".repeat(2500)}`,
		});
		sendMessage(frame, { type: "ready" });
		expect(screen.getByRole("alert").textContent).toContain("<img src=x>");
		expect(screen.getByRole("alert").querySelector("img")).toBeNull();
		expect(screen.getByRole("alert").textContent?.length).toBeLessThan(
			2100,
		);
		rerender(<HtmlPreview html="<p>Fixed</p>" />);
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("reports an initialization timeout but recovers when the bridge becomes ready", () => {
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		render(<HtmlPreview html="<p>Waiting</p>" />);
		act(() => vi.advanceTimersByTime(9999));
		expect(screen.queryByRole("alert")).toBeNull();
		act(() => vi.advanceTimersByTime(1));
		expect(screen.getByRole("alert").textContent).toContain(
			"fileExplorer.overlay.toasts.anError",
		);
		expect(log).toHaveBeenCalledOnce();
		sendMessage(getFrame(), { type: "ready" });
		expect(screen.queryByRole("alert")).toBeNull();
		expect(vi.getTimerCount()).toBe(0);
	});

	it("does not silently bypass a Trusted Types refusal", () => {
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		const setter = vi
			.spyOn(Element.prototype, "innerHTML", "set")
			.mockImplementation(() => {
				throw new TypeError("TrustedHTML required");
			});
		render(<HtmlPreview html="<p>Restricted</p>" />);
		setter.mockRestore();
		expect(screen.queryByTitle("HTML Preview")).toBeNull();
		expect(screen.getByRole("alert").textContent).toContain(
			"TrustedHTML required",
		);
		expect(log).toHaveBeenCalled();
	});
});

it("keeps author scripts intact and uses a non-application base unless one is supplied", () => {
	const html =
		'<!doctype html><html lang="en"><head><title>Example</title></head><body><script>document.body.dataset.ready = "yes";</script></body></html>';
	const source = createHtmlPreviewDocument(
		html,
		"test",
		"https://host.example",
	);
	expect(source.endsWith(html)).toBe(true);
	expect(source).toContain('<base href="about:srcdoc">');
	const explicitBase = createHtmlPreviewDocument(
		'<!-- <base href="/ignored"> --><base href="https://assets.example/"><p>Example</p>',
		"</script>",
		"https://host.example",
	);
	expect(explicitBase).toContain('<base href="https://assets.example/">');
	expect(explicitBase).toContain('"id":"\\u003c/script>"');
});
