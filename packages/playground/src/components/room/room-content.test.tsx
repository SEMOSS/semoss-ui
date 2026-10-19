import { act, render } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import type { RoomStore } from "@/stores/room/room.store";
import type { AbstractPixelMessage } from "@/types";
import { RoomContent } from "./room-content";

const mocks = vi.hoisted(() => {
	class MockResponseMessageStore {
		isThinking = true;
		visible = false;
		readonly type = "OUTPUT";
		key = "response";
		modelId = "router";
		ornaments: AbstractPixelMessage["ornaments"] = { modelName: "Router" };
		hasVisibleContent = true;
		shouldFoldUp = false;
		findAncestor = () => ({ modelId: "router" });
		parts: [] = [];
		hasUnfinishedTools = false;
	}

	return {
		MockResponseMessageStore,
		scrollTo: vi.fn(),
	};
});

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@semoss/ui/next", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/ui/next")>();
	return {
		...actual,
		ScrollArea: ({
			children,
			viewportRef,
		}: PropsWithChildren<{
			viewportRef?: (element: HTMLDivElement | null) => void;
		}>) => (
			<div
				data-testid="room-scroll-viewport"
				ref={(element) => {
					if (element) {
						Object.defineProperties(element, {
							clientHeight: { configurable: true, value: 480 },
							scrollHeight: { configurable: true, value: 480 },
						});
						element.scrollTo = mocks.scrollTo;
					}
					viewportRef?.(element);
				}}
			>
				{children}
			</div>
		),
	};
});

vi.mock("@/components/message/input-message", () => ({
	InputMessage: () => null,
}));
vi.mock("@/components/message/response-message", () => ({
	ResponseMessage: () => null,
}));
vi.mock("@/components/room/room-input", () => ({ RoomInput: () => null }));
vi.mock("@/contexts/file-drag-context", () => ({
	useFileDrag: () => ({ isDragging: false }),
}));
vi.mock("@/hooks/use-chat", () => ({
	useChat: () => ({ chat: { setSelectedModel: vi.fn() } }),
}));
vi.mock("@/hooks/use-graceful-errors", () => ({
	useGracefulErrors: () => ({
		getGracefulErrorMessage: (error: unknown) => String(error),
	}),
}));
vi.mock("@/stores/message/response-message.store", () => ({
	ResponseMessageStore: mocks.MockResponseMessageStore,
}));

vi.mock("./room-generating-indicator", () => ({
	RoomGeneratingIndicator: () => null,
}));

vi.mock("./room-suggestions", () => ({
	RoomSuggestions: () => null,
}));

let resizeObserverCallback: ResizeObserverCallback | null = null;
let nextAnimationFrameId = 0;
const animationFrames = new Map<number, FrameRequestCallback>();

const flushAnimationFrames = () => {
	const callbacks = [...animationFrames.values()];
	animationFrames.clear();
	callbacks.forEach((callback) => {
		callback(0);
	});
};

beforeEach(() => {
	resizeObserverCallback = null;
	nextAnimationFrameId = 0;
	animationFrames.clear();
	mocks.scrollTo.mockReset();

	vi.stubGlobal(
		"requestAnimationFrame",
		vi.fn((callback: FrameRequestCallback) => {
			nextAnimationFrameId += 1;
			animationFrames.set(nextAnimationFrameId, callback);
			return nextAnimationFrameId;
		}),
	);
	vi.stubGlobal(
		"cancelAnimationFrame",
		vi.fn((frameId: number) => {
			animationFrames.delete(frameId);
		}),
	);
	vi.stubGlobal(
		"ResizeObserver",
		class {
			constructor(callback: ResizeObserverCallback) {
				resizeObserverCallback = callback;
			}

			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
});

/** Minimal room state shared by the scroll and routed-message rendering scenarios. */
const createRoom = (
	response: InstanceType<typeof mocks.MockResponseMessageStore>,
) =>
	({
		history: [response],
		latestResponseMessage: response,
		agentGreeting: null,
		error: null,
		theme: { featureFlags: {} },
		options: { predefinedPrompts: [], mcp: [] },
		model: null,
		mode: "ask",
		isLoading: false,
		isCancelling: false,
		canCancel: false,
		getTool: vi.fn(() => undefined),
		openSidebarPanel: vi.fn(),
		setModel: vi.fn(),
		setOptions: vi.fn(),
		updateRoomOptions: vi.fn(),
		syncRoomOptions: vi.fn(),
		askMessage: vi.fn(),
		compactMessages: vi.fn(),
		cancelActiveJob: vi.fn(),
		processTool: vi.fn(),
	}) as unknown as RoomStore;

test("finishes the stream scroll before a later grouped-tool resize", () => {
	const response = new mocks.MockResponseMessageStore();
	const room = createRoom(response);
	const { getByTestId, rerender } = render(<RoomContent room={room} />);
	act(flushAnimationFrames);
	mocks.scrollTo.mockClear();

	response.isThinking = false;
	const settledRoom = { ...room } as RoomStore;
	rerender(<RoomContent room={settledRoom} />);
	act(flushAnimationFrames);

	expect(mocks.scrollTo).toHaveBeenCalledTimes(1);
	expect(mocks.scrollTo).toHaveBeenLastCalledWith({
		top: 480,
		behavior: "smooth",
	});

	const content = getByTestId("room-scroll-viewport")
		.firstElementChild as HTMLDivElement;
	Object.defineProperty(content, "clientHeight", {
		configurable: true,
		value: 640,
	});
	act(() => {
		resizeObserverCallback?.([], {} as ResizeObserver);
	});
	act(flushAnimationFrames);

	expect(mocks.scrollTo).toHaveBeenCalledTimes(1);
});

test("shows attribution for each response even when the selected router stays the same", () => {
	const first = new mocks.MockResponseMessageStore();
	first.visible = true;
	first.isThinking = false;
	first.ornaments.routing = {
		routed_engine_id: "first",
		routed_engine_name: "First Model",
	};
	const second = new mocks.MockResponseMessageStore();
	second.key = "second";
	second.visible = true;
	second.isThinking = false;
	second.ornaments.routing = {
		routed_engine_id: "second",
		routed_engine_name: "Second Model",
	};
	const folded = new mocks.MockResponseMessageStore();
	folded.key = "folded";
	folded.visible = true;
	folded.isThinking = false;
	folded.shouldFoldUp = true;
	folded.ornaments.routing = {
		routed_engine_id: "backup",
		routed_engine_name: "Backup Model",
	};
	const room = {
		...createRoom(first),
		history: [first, second, folded],
	} as unknown as RoomStore;
	const { getByText } = render(<RoomContent room={room} />);
	expect(getByText("First Model")).toBeVisible();
	expect(getByText("Second Model")).toBeVisible();
	expect(getByText("Backup Model")).toBeVisible();
	expect(room.setModel).not.toHaveBeenCalled();
});
