import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../types";
import { MessageList } from "./message-list";

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

describe("MessageList", () => {
	it("renders every message via the default MessageBubble", () => {
		render(<MessageList messages={makeMessages()} />);
		expect(screen.getByText("hi")).toBeInTheDocument();
		expect(screen.getByText("hello back")).toBeInTheDocument();
	});

	it("shows the generic typing indicator when isTyping and there are no messages yet", () => {
		render(<MessageList messages={[]} isTyping />);
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
		render(<MessageList messages={messages} isTyping />);
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
		render(<MessageList messages={messages} isTyping />);
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.getByText("partial")).toBeInTheDocument();
	});

	it("shows the emptyState when there are no messages and nothing is typing", () => {
		render(
			<MessageList
				messages={[]}
				emptyState={<p>Say hello to start</p>}
			/>,
		);
		expect(screen.getByText("Say hello to start")).toBeInTheDocument();
	});

	it("does not show the emptyState while typing even with zero messages", () => {
		render(
			<MessageList
				messages={[]}
				isTyping
				emptyState={<p>Say hello to start</p>}
			/>,
		);
		expect(
			screen.queryByText("Say hello to start"),
		).not.toBeInTheDocument();
		expect(screen.getByRole("status")).toBeInTheDocument();
	});

	it("uses renderMessage to fully override per-message rendering", () => {
		render(
			<MessageList
				messages={makeMessages()}
				renderMessage={(message) => (
					<div data-testid={`custom-${message.id}`}>
						{message.parts.map((part) =>
							part.type === "text" ? part.text : null,
						)}
					</div>
				)}
			/>,
		);
		expect(screen.getByTestId("custom-1")).toHaveTextContent("hi");
		expect(screen.getByTestId("custom-2")).toHaveTextContent("hello back");
	});
});
