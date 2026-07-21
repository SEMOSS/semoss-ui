import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "../types";
import { MessageList } from "./message-list";

const { useChatContext } = vi.hoisted(() => ({ useChatContext: vi.fn() }));

vi.mock("../chat-provider", async (importOriginal) => {
	const original = await importOriginal<typeof import("../chat-provider")>();
	return {
		...original,
		useChatContext,
	};
});

function makeMessages(): ChatMessage[] {
	return [
		{
			id: "1",
			role: "user",
			parts: [{ type: "text", id: "p1", text: "hi" }],
			status: "complete",
			timestamp: new Date(),
		},
		{
			id: "2",
			role: "assistant",
			parts: [{ type: "text", id: "p2", text: "hello back" }],
			status: "complete",
			timestamp: new Date(),
		},
	];
}

function mockContext(overrides: Record<string, unknown> = {}) {
	useChatContext.mockReturnValue({
		messages: [],
		isTyping: false,
		recordFeedback: vi.fn(),
		downloadMessage: vi.fn(),
		...overrides,
	});
}

beforeEach(() => {
	useChatContext.mockReset();
});

describe("MessageList", () => {
	it("renders every message via the default MessageBubble", () => {
		mockContext({ messages: makeMessages() });
		render(<MessageList />);
		expect(screen.getByText("hi")).toBeInTheDocument();
		expect(screen.getByText("hello back")).toBeInTheDocument();
	});

	it("shows the generic typing indicator when isTyping and there are no messages yet", () => {
		mockContext({ messages: [], isTyping: true });
		render(<MessageList />);
		expect(
			screen.getByRole("status", { name: "Thinking through it..." }),
		).toBeInTheDocument();
	});

	it("shows the generic typing indicator while the streaming assistant message has no parts yet", () => {
		const messages: ChatMessage[] = [
			...makeMessages(),
			{
				id: "3",
				role: "assistant",
				parts: [],
				status: "streaming",
				timestamp: new Date(),
			},
		];
		mockContext({ messages, isTyping: true });
		render(<MessageList />);
		expect(
			screen.getByRole("status", { name: "Thinking through it..." }),
		).toBeInTheDocument();
	});

	it("hides the generic typing indicator once the streaming message has content", () => {
		const messages: ChatMessage[] = [
			...makeMessages(),
			{
				id: "3",
				role: "assistant",
				parts: [{ type: "text", id: "p3", text: "partial" }],
				status: "streaming",
				timestamp: new Date(),
			},
		];
		mockContext({ messages, isTyping: true });
		render(<MessageList />);
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.getByText("partial")).toBeInTheDocument();
	});

	it("shows the emptyState when there are no messages and nothing is typing", () => {
		mockContext({ messages: [], isTyping: false });
		render(<MessageList emptyState={<p>Say hello to start</p>} />);
		expect(screen.getByText("Say hello to start")).toBeInTheDocument();
	});

	it("does not show the emptyState while typing even with zero messages", () => {
		mockContext({ messages: [], isTyping: true });
		render(<MessageList emptyState={<p>Say hello to start</p>} />);
		expect(
			screen.queryByText("Say hello to start"),
		).not.toBeInTheDocument();
		expect(screen.getByRole("status")).toBeInTheDocument();
	});

	it("uses renderMessage to fully override per-message rendering", () => {
		const recordFeedback = vi.fn();
		const downloadMessage = vi.fn().mockResolvedValue(undefined);
		mockContext({
			messages: makeMessages(),
			recordFeedback,
			downloadMessage,
		});
		render(
			<MessageList
				renderMessage={(message, helpers) => (
					<button
						type="button"
						data-testid={`custom-${message.id}`}
						onClick={() => {
							helpers.onRate(true);
							void helpers.onDownload("pdf");
						}}
					>
						{message.parts.map((part) =>
							part.type === "text" ? part.text : null,
						)}
					</button>
				)}
			/>,
		);
		expect(screen.getByTestId("custom-1")).toHaveTextContent("hi");
		expect(screen.getByTestId("custom-2")).toHaveTextContent("hello back");
		screen.getByTestId("custom-2").click();
		expect(recordFeedback).toHaveBeenCalledWith("2", true);
		expect(downloadMessage).toHaveBeenCalledWith("2", "pdf");
	});

	it("passes openToolResponse helper into custom renderMessage", () => {
		let helpersProvided = false;
		mockContext({ messages: makeMessages() });
		render(
			<MessageList
				renderMessage={(_message, helpers) => {
					helpersProvided =
						typeof helpers.openToolResponse === "function";
					return <div>custom</div>;
				}}
			/>,
		);

		expect(helpersProvided).toBe(true);
	});
});
