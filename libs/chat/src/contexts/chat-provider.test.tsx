import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import type { ChatStoreState } from "../stores/chat/chat-store";
import { ChatProvider } from "./chat-provider";

const mocks = vi.hoisted(() => ({
	createChatStore: vi.fn(),
	registerChatStore: vi.fn(),
	setActiveChatStore: vi.fn(),
	useInsight: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({ useInsight: mocks.useInsight }));
vi.mock("../stores/chat/chat-store", async (importOriginal) => ({
	...(await importOriginal<typeof import("../stores/chat/chat-store")>()),
	createChatStore: mocks.createChatStore,
}));
vi.mock("../chat-imperative", () => ({
	registerChatStore: mocks.registerChatStore,
	setActiveChatStore: mocks.setActiveChatStore,
}));

function createHandle() {
	const store = createStore<ChatStoreState>(() => ({
		messages: [],
		isTyping: false,
		error: null,
		roomId: null,
		engineId: "engine-1",
		isLoadingHistory: false,
		mcp: [],
		setEngineId: vi.fn(),
		sendMessage: vi.fn(async () => undefined),
		recordFeedback: vi.fn(async () => undefined),
		downloadMessage: vi.fn(async () => undefined),
		setMcp: vi.fn(async () => undefined),
	}));
	return {
		store,
		start: vi.fn(async () => undefined),
		dispose: vi.fn(),
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.useInsight.mockReturnValue({ actions: {}, insightId: "insight-1" });
	mocks.registerChatStore.mockReturnValue({
		id: "registration-1",
		dispose: vi.fn(),
	});
});

describe("ChatProvider", () => {
	it("retains one handle across rerenders and disposes it on unmount", () => {
		const handle = createHandle();
		mocks.createChatStore.mockReturnValue(handle);

		const { rerender, unmount } = render(
			<ChatProvider options={{ engineId: "engine-1" }}>
				<span>chat child</span>
			</ChatProvider>,
		);

		rerender(
			<ChatProvider options={{ engineId: "engine-2" }}>
				<span>chat child</span>
			</ChatProvider>,
		);

		expect(screen.getByText("chat child")).toBeInTheDocument();
		expect(mocks.createChatStore).toHaveBeenCalledTimes(1);
		expect(mocks.createChatStore).toHaveBeenCalledWith(
			{},
			"insight-1",
			{ engineId: "engine-1" },
			{ autoload: false },
		);
		expect(handle.start).toHaveBeenCalledTimes(1);
		expect(mocks.registerChatStore).toHaveBeenCalledWith(handle.store);
		expect(mocks.setActiveChatStore).toHaveBeenCalledWith(handle.store);

		unmount();
		expect(handle.dispose).toHaveBeenCalledTimes(1);
	});
});
