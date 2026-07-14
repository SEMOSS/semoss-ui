import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatOptions } from "../chat-options";
import { ChatPanel } from "./chat-panel";

const { useChat } = vi.hoisted(() => ({ useChat: vi.fn() }));

vi.mock("../use-chat", () => ({ useChat }));

const options: ChatOptions = { engineId: "test-engine" };

beforeEach(() => {
	useChat.mockReset();
});

describe("ChatPanel", () => {
	it("renders messages from useChat and sends new ones through it", async () => {
		const sendMessage = vi.fn();
		useChat.mockReturnValue({
			messages: [
				{
					id: "1",
					role: "user",
					parts: [{ type: "text", id: "p1", text: "hi" }],
					status: "complete",
					timestamp: new Date(),
				},
			],
			isTyping: false,
			error: null,
			roomId: "room-1",
			sendMessage,
		});

		const user = userEvent.setup();
		render(<ChatPanel options={options} />);

		expect(screen.getByText("hi")).toBeInTheDocument();

		await user.type(screen.getByPlaceholderText("Message..."), "hello");
		await user.keyboard("{Enter}");

		expect(sendMessage).toHaveBeenCalledWith("hello");
	});

	it("shows the typing indicator and disables input while isTyping", () => {
		useChat.mockReturnValue({
			messages: [],
			isTyping: true,
			error: null,
			roomId: null,
			sendMessage: vi.fn(),
		});

		render(<ChatPanel options={options} />);

		expect(screen.getByRole("status")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Message...")).toBeDisabled();
	});

	it("passes emptyState through to MessageList", () => {
		useChat.mockReturnValue({
			messages: [],
			isTyping: false,
			error: null,
			roomId: null,
			sendMessage: vi.fn(),
		});

		render(
			<ChatPanel options={options} emptyState={<p>Start chatting</p>} />,
		);

		expect(screen.getByText("Start chatting")).toBeInTheDocument();
	});

	it("renders an inline tool_call from a message's parts via MessageBubble", () => {
		useChat.mockReturnValue({
			messages: [
				{
					id: "1",
					role: "assistant",
					parts: [
						{
							type: "tool_call",
							id: "tool-1",
							name: "lookupAccount",
							arguments: {},
						},
					],
					status: "streaming",
					timestamp: new Date(),
				},
			],
			isTyping: true,
			error: null,
			roomId: null,
			sendMessage: vi.fn(),
		});

		render(<ChatPanel options={options} />);

		expect(
			screen.getByText("Running lookupAccount..."),
		).toBeInTheDocument();
	});

	it("passes a custom placeholder through to ChatInput", () => {
		useChat.mockReturnValue({
			messages: [],
			isTyping: false,
			error: null,
			roomId: null,
			sendMessage: vi.fn(),
		});

		render(<ChatPanel options={options} placeholder="Ask me anything" />);

		expect(
			screen.getByPlaceholderText("Ask me anything"),
		).toBeInTheDocument();
	});
});
