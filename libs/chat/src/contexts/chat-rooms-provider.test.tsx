import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import type { ChatRoomsStoreState } from "../stores/chat-rooms/chat-rooms-store";
import { ChatRoomsProvider } from "./chat-rooms-provider";

const mocks = vi.hoisted(() => ({
	createChatRoomsStore: vi.fn(),
	useDebouncedValue: vi.fn((value: string) => value),
	useInsight: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({ useInsight: mocks.useInsight }));
vi.mock("@semoss/ui/next", () => ({
	useDebouncedValue: mocks.useDebouncedValue,
}));
vi.mock("../stores/chat-rooms/chat-rooms-store", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("../stores/chat-rooms/chat-rooms-store")
	>()),
	createChatRoomsStore: mocks.createChatRoomsStore,
}));

function createHandle() {
	const store = createStore<ChatRoomsStoreState>(() => ({
		pinnedRooms: [],
		rooms: [],
		search: "",
		isLoading: false,
		isLoadingMore: false,
		hasMore: true,
		error: null,
		activeRoomId: null,
		setSearch: vi.fn(),
		loadMore: vi.fn(),
		renameRoom: vi.fn(async () => undefined),
		pinRoom: vi.fn(async () => undefined),
		deleteRoom: vi.fn(async () => undefined),
		setActiveRoom: vi.fn(),
		newChat: vi.fn(),
		refetch: vi.fn(async () => undefined),
	}));
	return {
		store,
		session: { setSearch: vi.fn() },
		start: vi.fn(async () => undefined),
		dispose: vi.fn(),
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.useInsight.mockReturnValue({
		actions: {},
		isAuthorized: false,
		isReady: false,
	});
});

describe("ChatRoomsProvider", () => {
	it("retains one handle and starts only after authorization", () => {
		const handle = createHandle();
		mocks.createChatRoomsStore.mockReturnValue(handle);

		const { rerender, unmount } = render(
			<ChatRoomsProvider pageSize={10}>
				<span>rooms child</span>
			</ChatRoomsProvider>,
		);

		expect(handle.start).not.toHaveBeenCalled();

		mocks.useInsight.mockReturnValue({
			actions: {},
			isAuthorized: true,
			isReady: true,
		});
		rerender(
			<ChatRoomsProvider pageSize={20}>
				<span>rooms child</span>
			</ChatRoomsProvider>,
		);

		expect(mocks.createChatRoomsStore).toHaveBeenCalledTimes(1);
		expect(mocks.createChatRoomsStore).toHaveBeenCalledWith({}, 10, {
			autoload: false,
		});
		expect(handle.start).toHaveBeenCalledTimes(1);

		unmount();
		expect(handle.dispose).toHaveBeenCalledTimes(1);
	});
});
