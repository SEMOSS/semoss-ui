import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";
import type { ConversationMessage } from "../types/message";
import { ownedMessageParts } from "../utils/message-presentation";
import { MessageActions } from "./message-actions";

vi.mock("@semoss/utility", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/utility")>()),
	copyTextToClipboard: vi.fn().mockResolvedValue(undefined),
}));

const message: ConversationMessage = {
	id: "message",
	role: "assistant",
	parts: [
		{ type: "text", text: "**Answer**" },
		{ type: "thinking", text: "Reasoning" },
		{
			type: "tool",
			tool: {
				id: "tool",
				parentMessageId: "message",
				name: "search",
				title: "Search",
				arguments: { query: "private input" },
				output: "raw output",
				status: "COMPLETED",
			},
		},
	],
};

beforeEach(() => vi.mocked(copyTextToClipboard).mockClear());
afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

it("copies response text and continuations in order, preserving Markdown and excluding other parts", async () => {
	const parts = [
		...ownedMessageParts(message),
		...ownedMessageParts({
			id: "prompt",
			role: "user",
			parts: [{ type: "text", text: "Prompt" }],
		}),
		...ownedMessageParts({
			id: "continuation",
			role: "assistant",
			parts: [
				{ type: "text", text: "   " },
				{ type: "text", text: "- Next step" },
			],
		}),
	];
	render(
		<MessageActions message={message} parts={parts}>
			<article aria-label="Assistant response">Answer</article>
		</MessageActions>,
	);
	expect(screen.queryByRole("button")).toBeNull();
	expect(screen.queryByRole("button", { name: "Copy response" })).toBeNull();
	fireEvent.pointerEnter(screen.getByRole("article"), {
		pointerType: "mouse",
	});
	expect(
		screen.getByRole("dialog", { name: "Response actions" }),
	).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "Copy response" }));
	await waitFor(() =>
		expect(screen.getByRole("status")).toHaveTextContent("Response copied"),
	);
	expect(screen.getByRole("button", { name: "Copied" })).toBeVisible();
	expect(copyTextToClipboard).toHaveBeenCalledWith(
		"**Answer**\n\n- Next step",
	);
});

it("opens on response focus, reaches actions with Tab, and dismisses with Escape", async () => {
	const user = userEvent.setup();
	render(
		<MessageActions message={message}>
			<article aria-label="Assistant response">Answer</article>
		</MessageActions>,
	);
	const trigger = screen.getByRole("article");
	await user.tab();
	expect(trigger).toHaveFocus();
	expect(screen.getByRole("button", { name: "Copy response" })).toBeVisible();
	await user.tab();
	expect(screen.getByRole("button", { name: "Copy response" })).toHaveFocus();
	await user.keyboard("{Escape}");
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(trigger).toHaveFocus();
	expect(copyTextToClipboard).not.toHaveBeenCalled();
	await user.keyboard(" ");
	expect(screen.getByRole("button", { name: "Copy response" })).toHaveFocus();
	await user.keyboard("{Enter}");
	expect(copyTextToClipboard).toHaveBeenCalledWith("**Answer**");
	expect(screen.getByRole("button", { name: "Copied" })).toHaveFocus();
	await user.keyboard("{Escape}");
	expect(trigger).toHaveFocus();
	expect(screen.queryByRole("dialog")).toBeNull();
});

it("omits the action for prompts, reasoning-only responses, and empty responses", () => {
	const { rerender } = render(
		<MessageActions message={{ ...message, role: "user" }}>
			<article>Response</article>
		</MessageActions>,
	);
	fireEvent.pointerEnter(screen.getByRole("article"));
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(screen.getByRole("article")).not.toHaveAttribute("tabindex");
	rerender(
		<MessageActions
			message={{
				...message,
				parts: [
					{ type: "thinking", text: "Reasoning" },
					{ type: "text", text: "  " },
				],
			}}
		>
			<article>Response</article>
		</MessageActions>,
	);
	fireEvent.pointerEnter(screen.getByRole("article"));
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(screen.getByRole("article")).not.toHaveAttribute("tabindex");
	rerender(
		<MessageActions message={{ ...message, parts: [] }}>
			<article>Response</article>
		</MessageActions>,
	);
	fireEvent.pointerEnter(screen.getByRole("article"));
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(screen.getByRole("article")).not.toHaveAttribute("tabindex");
});

it("keeps actions reachable across the hover gap and closes after leaving both surfaces", () => {
	vi.useFakeTimers();
	render(
		<MessageActions message={message}>
			<article>Answer</article>
		</MessageActions>,
	);
	const response = screen.getByRole("article");
	fireEvent.pointerEnter(response, { pointerType: "mouse" });
	expect(response).not.toHaveFocus();
	const popover = screen.getByRole("dialog", { name: "Response actions" });
	fireEvent.pointerLeave(response);
	act(() => vi.advanceTimersByTime(75));
	fireEvent.pointerEnter(popover);
	act(() => vi.advanceTimersByTime(200));
	expect(popover).toBeVisible();
	fireEvent.pointerLeave(popover);
	act(() => vi.advanceTimersByTime(200));
	expect(screen.queryByRole("dialog")).toBeNull();
});

it("lets keyboard users leave the actions and continue to the next control", async () => {
	const user = userEvent.setup();
	render(
		<>
			<MessageActions message={message}>
				<article>
					Answer <a href="#source">Source</a>
				</article>
			</MessageActions>
			<button type="button">Next response</button>
		</>,
	);
	await user.tab();
	await user.tab();
	expect(screen.getByRole("button", { name: "Copy response" })).toHaveFocus();
	await user.tab();
	expect(screen.getByRole("article")).toHaveFocus();
	expect(screen.queryByRole("dialog")).toBeNull();
	await user.tab();
	expect(screen.getByRole("link", { name: "Source" })).toHaveFocus();
	await user.tab();
	expect(screen.getByRole("button", { name: "Next response" })).toHaveFocus();
});

it("opens on a touch-style click without intercepting embedded controls or selected text", () => {
	const handleTool = vi.fn();
	render(
		<MessageActions message={message}>
			<article>
				<p>Answer</p>
				<button type="button" onClick={handleTool}>
					Tool details
				</button>
			</article>
		</MessageActions>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Tool details" }));
	expect(handleTool).toHaveBeenCalledOnce();
	expect(screen.queryByRole("dialog")).toBeNull();
	const selection = window.getSelection();
	const range = document.createRange();
	range.selectNodeContents(screen.getByText("Answer"));
	selection?.addRange(range);
	fireEvent.click(screen.getByText("Answer"));
	expect(screen.queryByRole("dialog")).toBeNull();
	selection?.removeAllRanges();
	fireEvent.click(screen.getByText("Answer"));
	expect(screen.getByRole("button", { name: "Copy response" })).toBeVisible();
});

it("reports clipboard failure and allows another attempt without false success", async () => {
	const error = vi.spyOn(toast, "error").mockReturnValue("copy-error");
	vi.mocked(copyTextToClipboard).mockRejectedValueOnce(
		new Error("Clipboard unavailable"),
	);
	render(
		<MessageActions message={message}>
			<article aria-label="Assistant response">Answer</article>
		</MessageActions>,
	);
	fireEvent.click(screen.getByRole("article"));
	fireEvent.click(screen.getByRole("button", { name: "Copy response" }));
	await waitFor(() =>
		expect(error).toHaveBeenCalledWith("Could not copy this response."),
	);
	expect(screen.getByRole("status")).toBeEmptyDOMElement();
	expect(
		screen.getByRole("dialog", { name: "Response actions" }),
	).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "Copy response" }));
	await waitFor(() =>
		expect(screen.getByRole("status")).toHaveTextContent("Response copied"),
	);
	expect(screen.getByRole("button", { name: "Copied" })).toBeVisible();
});
