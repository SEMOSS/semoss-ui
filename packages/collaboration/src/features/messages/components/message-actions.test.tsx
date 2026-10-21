import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
	render(<MessageActions message={message} parts={parts} />);
	expect(screen.getByRole("button", { name: "Copy response" })).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "Copy response" }));
	await waitFor(() =>
		expect(screen.getByRole("status")).toHaveTextContent("Response copied"),
	);
	expect(screen.getByRole("button", { name: "Copied" })).toBeVisible();
	expect(copyTextToClipboard).toHaveBeenCalledWith(
		"**Answer**\n\n- Next step",
	);
});

it("follows document order through response links, copy, and the next control", async () => {
	const user = userEvent.setup();
	render(
		<>
			<article>
				Answer <a href="#source">Source</a>
				<MessageActions message={message} />
			</article>
			<button type="button">Next response</button>
		</>,
	);
	await user.tab();
	expect(screen.getByRole("link", { name: "Source" })).toHaveFocus();
	await user.tab();
	expect(screen.getByRole("button", { name: "Copy response" })).toHaveFocus();
	await user.keyboard("{Enter}");
	expect(copyTextToClipboard).toHaveBeenCalledWith("**Answer**");
	expect(screen.getByRole("button", { name: "Copied" })).toHaveFocus();
	await user.tab();
	expect(screen.getByRole("button", { name: "Next response" })).toHaveFocus();
	await user.tab({ shift: true });
	expect(screen.getByRole("button", { name: "Copied" })).toHaveFocus();
	await user.keyboard(" ");
	expect(copyTextToClipboard).toHaveBeenCalledTimes(2);
	expect(screen.queryByRole("dialog")).toBeNull();
});

it("omits the action for prompts, reasoning-only responses, and empty responses", () => {
	const { container, rerender } = render(
		<MessageActions message={{ ...message, role: "user" }} />,
	);
	expect(container).toBeEmptyDOMElement();
	rerender(
		<MessageActions
			message={{
				...message,
				parts: [
					{ type: "thinking", text: "Reasoning" },
					{ type: "text", text: "  " },
				],
			}}
		/>,
	);
	expect(container).toBeEmptyDOMElement();
	rerender(<MessageActions message={{ ...message, parts: [] }} />);
	expect(container).toBeEmptyDOMElement();
});

it("copies with a single touch without first revealing any actions", async () => {
	const user = userEvent.setup();
	render(<MessageActions message={message} />);
	await user.pointer({
		keys: "[TouchA]",
		target: screen.getByRole("button", { name: "Copy response" }),
	});
	expect(copyTextToClipboard).toHaveBeenCalledWith("**Answer**");
	expect(screen.getByRole("button", { name: "Copied" })).toBeVisible();
	expect(screen.queryByRole("dialog")).toBeNull();
});

it("reports clipboard failure and allows another attempt without false success", async () => {
	const error = vi.spyOn(toast, "error").mockReturnValue("copy-error");
	vi.mocked(copyTextToClipboard).mockRejectedValueOnce(
		new Error("Clipboard unavailable"),
	);
	render(<MessageActions message={message} />);
	fireEvent.click(screen.getByRole("button", { name: "Copy response" }));
	await waitFor(() =>
		expect(error).toHaveBeenCalledWith("Could not copy this response."),
	);
	expect(screen.getByRole("status")).toBeEmptyDOMElement();
	expect(screen.getByRole("button", { name: "Copy response" })).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "Copy response" }));
	await waitFor(() =>
		expect(screen.getByRole("status")).toHaveTextContent("Response copied"),
	);
	expect(screen.getByRole("button", { name: "Copied" })).toBeVisible();
});
