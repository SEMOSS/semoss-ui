import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HtmlPreviewBlock } from "./html-preview-block";

// Sandpack spins up a real sandboxed bundler/iframe — not worth exercising
// in a unit test. Stub it so HtmlPreviewBlock's own toggle/dialog/streaming
// logic can be tested in isolation.
vi.mock("./sandpack-html-preview", () => ({
	SandpackHtmlPreview: ({ html }: { html: string }) => (
		<div data-testid="sandpack-preview">{html}</div>
	),
}));

describe("HtmlPreviewBlock", () => {
	it("shows the Sandpack preview by default", () => {
		render(<HtmlPreviewBlock html="<p>hi</p>" />);
		expect(screen.getByTestId("sandpack-preview")).toHaveTextContent(
			"<p>hi</p>",
		);
	});

	it("toggles to raw HTML source and back", async () => {
		const user = userEvent.setup();
		render(<HtmlPreviewBlock html="<p>hi</p>" />);

		await user.click(screen.getByRole("button", { name: "Raw" }));
		expect(
			screen.queryByTestId("sandpack-preview"),
		).not.toBeInTheDocument();
		// Shiki splits the highlighted code into multiple spans, so match on
		// the container's overall text rather than a single text node.
		expect(document.querySelector("code")?.textContent).toBe("<p>hi</p>");

		await user.click(screen.getByRole("button", { name: "Preview" }));
		expect(screen.getByTestId("sandpack-preview")).toBeInTheDocument();
	});

	it("collapses the block", async () => {
		const user = userEvent.setup();
		render(<HtmlPreviewBlock html="<p>hi</p>" />);
		await user.click(
			screen.getByRole("button", { name: "Collapse HTML Preview" }),
		);
		expect(
			screen.queryByTestId("sandpack-preview"),
		).not.toBeInTheDocument();
	});

	it("withholds an unsafe (mid-tag) streaming chunk from the preview", () => {
		render(<HtmlPreviewBlock html="<p>partial<" isLoading />);
		expect(screen.getByTestId("sandpack-preview")).toHaveTextContent("");
	});

	it("advances the preview once a streaming chunk becomes safe", () => {
		const { rerender } = render(
			<HtmlPreviewBlock html="<p>partial<" isLoading />,
		);
		expect(screen.getByTestId("sandpack-preview")).toHaveTextContent("");

		rerender(<HtmlPreviewBlock html="<p>partial</p>" isLoading />);
		expect(screen.getByTestId("sandpack-preview")).toHaveTextContent(
			"<p>partial</p>",
		);
	});

	it("renders the final HTML once streaming completes", () => {
		const { rerender } = render(
			<HtmlPreviewBlock html="<p>partial<" isLoading />,
		);
		rerender(<HtmlPreviewBlock html="<p>done</p>" isLoading={false} />);
		expect(screen.getByTestId("sandpack-preview")).toHaveTextContent(
			"<p>done</p>",
		);
	});
});
