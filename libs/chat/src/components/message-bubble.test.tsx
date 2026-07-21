import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ChatMessage, ChatMessagePart } from "../types";
import { MessageBubble } from "./message-bubble";

vi.mock("mermaid", () => ({
	default: {
		initialize: vi.fn(),
		render: vi.fn(async () => ({ svg: "<svg><text>diagram</text></svg>" })),
	},
}));

// Sandpack spins up a real sandboxed bundler/iframe — not worth exercising
// here; the dispatch (does an ```html fence reach HtmlPreviewBlock at all)
// is what this file cares about, not Sandpack's own rendering.
vi.mock("./sandpack-html-preview", () => ({
	SandpackHtmlPreview: ({ html }: { html: string }) => (
		<div data-testid="sandpack-preview">{html}</div>
	),
}));

function makeMessage(
	overrides: Partial<ChatMessage> & { text?: string } = {},
): ChatMessage {
	const { text, parts, ...rest } = overrides;
	return {
		id: "1",
		role: "assistant",
		parts: parts ?? [
			{ type: "text", id: "p1", text: text ?? "hello world" },
		],
		status: "complete",
		timestamp: new Date(),
		...rest,
	};
}

describe("MessageBubble", () => {
	it("renders the message text", () => {
		render(<MessageBubble message={makeMessage({ text: "hi there" })} />);
		expect(screen.getByText("hi there")).toBeInTheDocument();
	});

	it("renders GFM markdown (e.g. bold)", () => {
		render(<MessageBubble message={makeMessage({ text: "**bold**" })} />);
		const strong = screen.getByText("bold");
		expect(strong.tagName).toBe("STRONG");
	});

	it("renders a thinking part as muted italic text", () => {
		const parts: ChatMessagePart[] = [
			{ type: "thinking", id: "t1", text: "pondering..." },
		];
		render(<MessageBubble message={makeMessage({ parts })} />);
		expect(screen.getByText("pondering...")).toBeInTheDocument();
	});

	it("renders a tool_call part as running when there's no matching tool_result yet", () => {
		const parts: ChatMessagePart[] = [
			{
				type: "tool_call",
				id: "tool-1",
				name: "lookupAccount",
				arguments: {},
			},
		];
		render(<MessageBubble message={makeMessage({ parts })} />);
		expect(
			screen.getByText("Running lookupAccount..."),
		).toBeInTheDocument();
	});

	it("renders a tool_call part as done once a matching tool_result exists", () => {
		const parts: ChatMessagePart[] = [
			{
				type: "tool_call",
				id: "tool-1",
				name: "lookupAccount",
				arguments: {},
			},
			{
				type: "tool_result",
				id: "r1",
				toolCallId: "tool-1",
				output: "{}",
				status: "success",
			},
		];
		render(<MessageBubble message={makeMessage({ parts })} />);
		expect(screen.getByText("Ran lookupAccount")).toBeInTheDocument();
	});

	it("emits tool details when open-in-sidebar is clicked", async () => {
		const user = userEvent.setup();
		const onOpenToolResponse = vi.fn();
		const parts: ChatMessagePart[] = [
			{
				type: "tool_call",
				id: "tool-1",
				name: "lookupAccount",
				arguments: { id: "482" },
			},
			{
				type: "tool_result",
				id: "r1",
				toolCallId: "tool-1",
				output: '{"ok":true}',
				status: "success",
			},
		];

		render(
			<MessageBubble
				message={makeMessage({ parts })}
				onOpenToolResponse={onOpenToolResponse}
			/>,
		);

		await user.click(
			screen.getByRole("button", {
				name: "Open lookupAccount in sidebar",
			}),
		);

		expect(onOpenToolResponse).toHaveBeenCalledWith({
			id: "tool-1",
			name: "lookupAccount",
			status: "success",
			arguments: { id: "482" },
			output: '{"ok":true}',
		});
	});

	it("exposes role and status as data attributes", () => {
		render(<MessageBubble message={makeMessage({ role: "user" })} />);
		const bubble = screen
			.getByText("hello world")
			.closest('[data-slot="message-bubble"]');
		expect(bubble).toHaveAttribute("data-role", "user");
		expect(bubble).toHaveAttribute("data-status", "complete");
	});

	it("merges a custom className", () => {
		render(
			<MessageBubble
				message={makeMessage()}
				className="custom-bubble-class"
			/>,
		);
		const bubble = screen
			.getByText("hello world")
			.closest('[data-slot="message-bubble"]');
		expect(bubble).toHaveClass("custom-bubble-class");
	});

	it("styles a source: blockquote as a muted citation, not a real blockquote", () => {
		render(
			<MessageBubble
				message={makeMessage({ text: "> source: internal docs" })}
			/>,
		);
		// Blockquote content is itself paragraph-wrapped by remark, so the
		// text sits in a nested default <p> inside the citation div our
		// blockquote override returns.
		expect(document.querySelector("blockquote")).not.toBeInTheDocument();
		expect(document.querySelector("div.italic")?.textContent?.trim()).toBe(
			"source: internal docs",
		);
	});

	it("still renders a real blockquote normally", () => {
		render(
			<MessageBubble message={makeMessage({ text: "> a real quote" })} />,
		);
		expect(document.querySelector("blockquote")).toBeInTheDocument();
		expect(
			screen.getByText("a real quote").closest("blockquote"),
		).not.toBeNull();
	});

	it("renders a fenced code block in a bordered container with a language label and copy button", () => {
		render(
			<MessageBubble
				message={makeMessage({ text: "```python\nprint('hi')\n```" })}
			/>,
		);
		expect(screen.getByText("python")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Copy code" }),
		).toBeInTheDocument();
	});

	it("renders a GFM table wrapped in a collapsible, exportable Table block", () => {
		render(
			<MessageBubble
				message={makeMessage({
					text: "| a | b |\n| --- | --- |\n| 1 | 2 |",
				})}
			/>,
		);
		expect(screen.getByText("Table")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Export to CSV" }),
		).toBeInTheDocument();
		expect(screen.getByRole("table")).toBeInTheDocument();
	});

	it("dispatches a ```mermaid fence to the Mermaid diagram block", async () => {
		render(
			<MessageBubble
				message={makeMessage({
					text: "```mermaid\ngraph TD; A-->B\n```",
				})}
			/>,
		);
		expect(screen.getByText("Mermaid")).toBeInTheDocument();
		await waitFor(() => {
			expect(document.querySelector("svg text")).toBeInTheDocument();
		});
	});

	it("dispatches a ```html fence to the HTML preview block", () => {
		render(
			<MessageBubble
				message={makeMessage({ text: "```html\n<p>hi</p>\n```" })}
			/>,
		);
		expect(screen.getByText("HTML Preview")).toBeInTheDocument();
		expect(screen.getByTestId("sandpack-preview")).toHaveTextContent(
			"<p>hi</p>",
		);
	});

	it("skips rendering an incomplete HTML preview fence while the message is still streaming", () => {
		render(
			<MessageBubble
				message={makeMessage({
					text: "```html\n<p>partial<",
					status: "streaming",
				})}
			/>,
		);
		expect(screen.getByTestId("sandpack-preview")).toHaveTextContent("");
	});

	it("shows the feedback toolbar for a completed assistant message when onRate is provided", () => {
		render(
			<MessageBubble
				message={makeMessage({ role: "assistant" })}
				onRate={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Good response" }),
		).toBeInTheDocument();
	});

	it("omits the feedback toolbar when onRate is not provided", () => {
		render(<MessageBubble message={makeMessage({ role: "assistant" })} />);
		expect(
			screen.queryByRole("button", { name: "Good response" }),
		).not.toBeInTheDocument();
	});

	it("omits the feedback toolbar for user messages, error messages, and streaming messages", () => {
		const { rerender } = render(
			<MessageBubble
				message={makeMessage({ role: "user" })}
				onRate={vi.fn()}
			/>,
		);
		expect(
			screen.queryByRole("button", { name: "Good response" }),
		).not.toBeInTheDocument();

		rerender(
			<MessageBubble
				message={makeMessage({ role: "assistant", status: "error" })}
				onRate={vi.fn()}
			/>,
		);
		expect(
			screen.queryByRole("button", { name: "Good response" }),
		).not.toBeInTheDocument();

		rerender(
			<MessageBubble
				message={makeMessage({
					role: "assistant",
					status: "streaming",
				})}
				onRate={vi.fn()}
			/>,
		);
		expect(
			screen.queryByRole("button", { name: "Good response" }),
		).not.toBeInTheDocument();
	});

	it("passes the message's current feedback rating and calls onRate on click", async () => {
		const user = userEvent.setup();
		const onRate = vi.fn();
		render(
			<MessageBubble
				message={makeMessage({
					role: "assistant",
					feedback: { rating: true },
				})}
				onRate={onRate}
			/>,
		);

		const goodButton = screen.getByRole("button", {
			name: "Good response",
		});
		expect(goodButton.querySelector("svg")).toHaveClass("fill-current");

		await user.click(screen.getByRole("button", { name: "Poor response" }));
		expect(onRate).toHaveBeenCalledWith(false);
	});
});
