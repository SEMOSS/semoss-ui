import { act, render } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { asObservableFake } from "../../testing/observable-fake";
import type { RoomUiStore } from "../workbench/room-ui.store";
import { RoomContent } from "./room-content";

const mocks = vi.hoisted(() => {
	class MockResponseMessageStore {
		isThinking = true;
		visible = false;
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

vi.mock("../../components/message/input-message", () => ({
	InputMessage: () => null,
}));
vi.mock("../../components/message/response-message", () => ({
	ResponseMessage: () => null,
}));
vi.mock("../composer/room-composer", () => ({
	RoomComposer: () => null,
}));
vi.mock("../../contexts/file-drag.context", () => ({
	useFileDrag: () => ({ isDragging: false }),
}));
vi.mock("../../host/chat.context", () => ({
	useChat: () => ({
		chat: { setSelectedModel: vi.fn() },
		config: { featureFlags: {}, allowedUrlPrefixes: [] },
	}),
}));
vi.mock("../../hooks/use-graceful-errors", () => ({
	useGracefulErrors: () => ({
		getGracefulErrorMessage: (error: unknown) => String(error),
	}),
}));
vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	ResponseMessageStore: mocks.MockResponseMessageStore,
}));

vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	ChatGeneratingIndicator: () => null,
}));

vi.mock("../suggestions/room-suggestions", () => ({
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

test("finishes the stream scroll before a later grouped-tool resize", () => {
	const response = new mocks.MockResponseMessageStore();
	const room = asObservableFake({
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
	}) as unknown as RoomUiStore;

	const { getByTestId, rerender } = render(<RoomContent room={room} />);
	act(flushAnimationFrames);
	mocks.scrollTo.mockClear();

	response.isThinking = false;
	const settledRoom = { ...room } as RoomUiStore;
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
