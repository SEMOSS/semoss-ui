import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatDemoBridge, ChatDemoDoc } from "./chat-demo-doc";

const mocks = vi.hoisted(() => ({
	activeRoomId: null as string | null,
	mountedEngines: [] as string[],
}));

vi.mock("@semoss/chat", async () => {
	const { useEffect } = await import("react");
	return {
		ChatProvider: ({
			children,
			options,
		}: {
			children: ReactNode;
			options: { engineId: string };
		}) => {
			useEffect(() => {
				mocks.mountedEngines.push(options.engineId);
			}, []);
			return <div data-testid="chat-provider">{children}</div>;
		},
		ChatRoomsProvider: ({ children }: { children: ReactNode }) => children,
		useChatContext: () => ({
			isTyping: false,
			sendMessage: vi.fn(),
			mcp: [],
			setMcp: vi.fn(),
		}),
		useChatRoomsContext: () => ({
			pinnedRooms: [],
			rooms: [],
			search: "",
			isLoading: false,
			isLoadingMore: false,
			hasMore: false,
			activeRoomId: mocks.activeRoomId,
			setSearch: vi.fn(),
			loadMore: vi.fn(),
			renameRoom: vi.fn(),
			pinRoom: vi.fn(),
			deleteRoom: vi.fn(),
			setActiveRoom: vi.fn(),
			newChat: vi.fn(),
		}),
	};
});

vi.mock("@semoss/chat/components", () => ({
	ChatInput: () => <div />,
	ChatRoomsPage: () => <div data-testid="chat-rooms-page" />,
	McpMenuButton: () => <div />,
	MessageBubble: () => <div />,
	MessageList: () => <div />,
	PromptOptimizer: () => <div />,
	RoomSidebar: ({ activeRoomId }: { activeRoomId?: string | null }) => (
		<div data-testid="room-sidebar" data-active-room={activeRoomId ?? ""} />
	),
	SelectionChatButton: () => (
		<button type="button">Send selection to chat</button>
	),
}));

vi.mock("../doc-page", () => ({
	DocPage: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("../engine-connect-context", () => ({
	useEngineConnect: () => ({
		engine: { engineId: "engine-a", engineName: "Engine A" },
	}),
}));

beforeEach(() => {
	mocks.activeRoomId = null;
	mocks.mountedEngines.length = 0;
});

describe("ChatDemoBridge", () => {
	it("renders the imperative selection control outside ChatProvider", () => {
		render(<ChatDemoDoc />);

		const imperativeButton = screen.getByRole("button", {
			name: "Send selection to chat",
		});
		expect(imperativeButton).toBeInTheDocument();
		expect(
			screen.getByTestId("chat-provider").contains(imperativeButton),
		).toBe(false);
	});

	it("remounts new chats by engine and keeps saved rooms keyed by room", () => {
		const { rerender } = render(<ChatDemoBridge engineId="engine-a" />);

		expect(mocks.mountedEngines).toEqual(["engine-a"]);
		expect(screen.getByTestId("room-sidebar")).toHaveAttribute(
			"data-active-room",
			"",
		);

		rerender(<ChatDemoBridge engineId="engine-b" />);
		expect(mocks.mountedEngines).toEqual(["engine-a", "engine-b"]);

		mocks.activeRoomId = "room-1";
		rerender(<ChatDemoBridge engineId="engine-b" />);
		expect(mocks.mountedEngines).toEqual([
			"engine-a",
			"engine-b",
			"engine-b",
		]);
		expect(screen.getByTestId("room-sidebar")).toHaveAttribute(
			"data-active-room",
			"room-1",
		);

		rerender(<ChatDemoBridge engineId="engine-c" />);
		expect(mocks.mountedEngines).toHaveLength(3);
	});
});
