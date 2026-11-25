import {
	act,
	cleanup,
	fireEvent,
	render,
	renderHook,
	screen,
} from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import { HtmlPreviewBlock } from "./html-preview-block";
import { useHtmlPreviewStream } from "./use-html-preview-stream";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/utility/clipboard", () => ({
	copyTextToClipboard: vi.fn(),
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	Code: ({ code }: { code: string }) => <pre>{code}</pre>,
}));
vi.mock("./save-file-dialog", () => ({
	SaveFileDialog: ({ content }: { content: string }) => (
		<output aria-label="HTML to Save">{content}</output>
	),
}));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	vi.useRealTimers();
});

it("throttles complete chunks at 120 ms without debouncing newer input", () => {
	const { result, rerender } = renderHook(
		({ html }) => useHtmlPreviewStream(html, true),
		{ initialProps: { html: "<p>First</p>" }, wrapper: StrictMode },
	);
	rerender({ html: "<p>Second</p>" });
	act(() => vi.advanceTimersByTime(60));
	rerender({ html: "<p>Third</p>" });
	act(() => vi.advanceTimersByTime(59));
	expect(result.current).toBe("<p>First</p>");
	act(() => vi.advanceTimersByTime(1));
	expect(result.current).toBe("<p>Third</p>");
	expect(vi.getTimerCount()).toBe(0);
});

it("waits for complete script, style, and tag chunks but never filters the final result", () => {
	const { result, rerender } = renderHook(
		({ html, isLoading }) => useHtmlPreviewStream(html, isLoading),
		{ initialProps: { html: "<script>unfinished", isLoading: true } },
	);
	expect(result.current).toBe("");
	rerender({ html: "<p>Complete</p>", isLoading: true });
	expect(result.current).toBe("<p>Complete</p>");
	for (const html of ["<script>unfinished", "<style>p {", "<p>Text</p><di"]) {
		rerender({ html, isLoading: true });
		act(() => vi.advanceTimersByTime(120));
		expect(result.current).toBe("<p>Complete</p>");
	}
	rerender({ html: "<p>Final", isLoading: false });
	expect(result.current).toBe("<p>Final");
});

it("cancels pending chunks on completion and cleans up on unmount", () => {
	const { result, rerender, unmount } = renderHook(
		({ html, isLoading }) => useHtmlPreviewStream(html, isLoading),
		{ initialProps: { html: "<p>First</p>", isLoading: true } },
	);
	rerender({ html: "<p>Pending</p>", isLoading: true });
	act(() => vi.advanceTimersByTime(119));
	rerender({ html: "<p>Final</p>", isLoading: false });
	expect(vi.getTimerCount()).toBe(0);
	act(() => vi.advanceTimersByTime(1000));
	expect(result.current).toBe("<p>Final</p>");
	rerender({ html: "<p>Final</p>", isLoading: true });
	expect(result.current).toBe("<p>Final</p>");

	rerender({ html: "<p>Unmounted</p>", isLoading: true });
	unmount();
	expect(vi.getTimerCount()).toBe(0);
});

it("keeps source, copy, and save payloads free of preview instrumentation", () => {
	const html = '<p>Original</p><script>console.log("example")</script>';
	render(
		<HtmlPreviewBlock
			html={html}
			copyTooltip="Copy HTML"
			copySuccessMessage="Copied"
		/>,
	);
	expect(screen.getByTitle("HTML Preview").getAttribute("srcdoc")).toContain(
		"semoss-html-preview",
	);
	expect(screen.getByLabelText("HTML to Save")).toHaveTextContent(html);
	fireEvent.click(screen.getByRole("button", { name: "Copy HTML" }));
	expect(copyTextToClipboard).toHaveBeenCalledWith(html, expect.any(Object));
	fireEvent.click(screen.getByRole("button", { name: "Edit HTML" }));
	expect(screen.getByText(html, { selector: "pre" })).toHaveTextContent(html);
	expect(screen.queryByTitle("HTML Preview")).not.toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: /refresh|new tab/i }),
	).not.toBeInTheDocument();
});

it("opens an independent full-height preview and returns focus when it closes", () => {
	render(
		<HtmlPreviewBlock
			html="<p>Example</p>"
			copyTooltip="Copy HTML"
			copySuccessMessage="Copied"
		/>,
	);
	const fullView = screen.getByRole("button", { name: "Full View" });
	fireEvent.click(fullView);
	const frames = screen.getAllByTitle("HTML Preview");
	expect(frames).toHaveLength(2);
	expect(frames[0].getAttribute("srcdoc")).not.toBe(
		frames[1].getAttribute("srcdoc"),
	);
	expect(screen.getByRole("dialog")).toHaveAccessibleName("HTML Preview");
	fireEvent.click(screen.getByRole("button", { name: "Close" }));
	act(() => vi.advanceTimersByTime(0));
	expect(screen.getAllByTitle("HTML Preview")).toHaveLength(1);
	expect(fullView).toHaveFocus();
});
