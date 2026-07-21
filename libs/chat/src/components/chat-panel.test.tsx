import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatOptions } from "../chat-options";
import { ChatPanel } from "./chat-panel";

const { useChatContext } = vi.hoisted(() => ({ useChatContext: vi.fn() }));

vi.mock("../chat-provider", async (importOriginal) => {
	const original = await importOriginal<typeof import("../chat-provider")>();
	return {
		...original,
		ChatProvider: ({ children }: { children: React.ReactNode }) => (
			<>{children}</>
		),
		useChatContext,
	};
});

const options: ChatOptions = { engineId: "test-engine" };

beforeEach(() => {
	useChatContext.mockReset();
});

describe("ChatPanel", () => {
	it("renders messages from useChatContext and sends new ones through it", async () => {
		const sendMessage = vi.fn();
		useChatContext.mockReturnValue({
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
			recordFeedback: vi.fn(),
			downloadMessage: vi.fn(),
		});

		const user = userEvent.setup();
		render(<ChatPanel options={options} />);

		expect(screen.getByText("hi")).toBeInTheDocument();

		await user.type(screen.getByPlaceholderText("Message..."), "hello");
		await user.keyboard("{Enter}");

		expect(sendMessage).toHaveBeenCalledWith("hello");
	});

	it("shows the typing indicator and disables input while isTyping", () => {
		useChatContext.mockReturnValue({
			messages: [],
			isTyping: true,
			error: null,
			roomId: null,
			sendMessage: vi.fn(),
			recordFeedback: vi.fn(),
			downloadMessage: vi.fn(),
		});

		render(<ChatPanel options={options} />);

		expect(screen.getByRole("status")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Message...")).toBeDisabled();
	});

	it("passes emptyState through to MessageList", () => {
		useChatContext.mockReturnValue({
			messages: [],
			isTyping: false,
			error: null,
			roomId: null,
			sendMessage: vi.fn(),
			recordFeedback: vi.fn(),
			downloadMessage: vi.fn(),
		});

		render(
			<ChatPanel options={options} emptyState={<p>Start chatting</p>} />,
		);

		expect(screen.getByText("Start chatting")).toBeInTheDocument();
	});

	it("renders an inline tool_call from a message's parts via MessageBubble", () => {
		useChatContext.mockReturnValue({
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
			recordFeedback: vi.fn(),
			downloadMessage: vi.fn(),
		});

		render(<ChatPanel options={options} />);

		expect(
			screen.getByText("Running lookupAccount..."),
		).toBeInTheDocument();
	});

	it("opens a resizable right sidebar panel for tool response details", async () => {
		const user = userEvent.setup();
		useChatContext.mockReturnValue({
			messages: [
				{
					id: "1",
					role: "assistant",
					parts: [
						{
							type: "tool_call",
							id: "tool-1",
							name: "lookupAccount",
							arguments: { id: "482" },
						},
						{
							type: "tool_result",
							id: "result-1",
							toolCallId: "tool-1",
							output: "ok",
							status: "success",
						},
					],
					status: "complete",
					timestamp: new Date(),
				},
			],
			isTyping: false,
			error: null,
			roomId: null,
			sendMessage: vi.fn(),
		});

		render(<ChatPanel options={options} />);

		await user.click(
			screen.getByRole("button", {
				name: "Open lookupAccount in sidebar",
			}),
		);

		expect(
			document.querySelector('[data-slot="tool-response-sidebar"]'),
		).toBeInTheDocument();
		expect(screen.getByText("Viewing lookupAccount")).toBeInTheDocument();
	});

	it("passes a custom placeholder through to ChatInput", () => {
		useChatContext.mockReturnValue({
			messages: [],
			isTyping: false,
			error: null,
			roomId: null,
			sendMessage: vi.fn(),
			recordFeedback: vi.fn(),
			downloadMessage: vi.fn(),
		});

		render(<ChatPanel options={options} placeholder="Ask me anything" />);

		expect(
			screen.getByPlaceholderText("Ask me anything"),
		).toBeInTheDocument();
	});
});
