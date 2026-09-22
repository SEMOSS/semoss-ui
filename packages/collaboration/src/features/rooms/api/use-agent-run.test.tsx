import { act, renderHook } from "@testing-library/react";
import type {
	AgentRunItemEvent,
	AgentRunItemsState,
	AgentRunSnapshot,
	PendingAgentAction,
	RoomStore,
} from "@semoss/sdk";

interface WatchCallbacks {
	onEvent: (event: AgentRunItemEvent, items: AgentRunItemsState) => void;
	onSnapshot: (
		snapshot: AgentRunSnapshot,
		meta: { droppedEvents: number },
	) => void;
	onReconcile: (snapshot: AgentRunSnapshot) => void;
	onError?: (error: Error) => void;
}

const agentStoreMock = vi.hoisted(() => {
	class FakeAgentStore {
		static instances: FakeAgentStore[] = [];
		static start = vi.fn(
			async (params: { roomId: string }, insightId: string) =>
				new FakeAgentStore(
					params.roomId,
					insightId,
					`run-${FakeAgentStore.instances.length + 1}`,
				),
		);

		readonly runId: string;
		callbacks: WatchCallbacks | null = null;
		durableSnapshot: AgentRunSnapshot;
		cancelSnapshot: AgentRunSnapshot;
		stop = vi.fn();
		getSnapshot = vi.fn(async () => this.durableSnapshot);
		cancel = vi.fn(async () => this.cancelSnapshot);
		decide = vi.fn(async () => "ok");

		constructor(roomId: string, _insightId: string, runId: string) {
			this.runId = runId;
			this.durableSnapshot = {
				runId,
				roomId,
				status: "RUNNING",
				pendingActions: [],
			};
			this.cancelSnapshot = {
				...this.durableSnapshot,
				status: "CANCELLED",
			};
			FakeAgentStore.instances.push(this);
		}

		watch(callbacks: WatchCallbacks) {
			this.callbacks = callbacks;
			return {
				stop: this.stop,
				getItems: () => ({ itemsById: {}, itemOrder: [] }),
				pokeNow: vi.fn(),
				done: Promise.resolve(null),
			};
		}

		static reset() {
			FakeAgentStore.instances = [];
			FakeAgentStore.start.mockClear();
		}
	}

	return { FakeAgentStore };
});

const uploadRoomFilesMock = vi.hoisted(() => vi.fn(async () => []));

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	AgentStore: agentStoreMock.FakeAgentStore,
}));

vi.mock("./upload-room-files", () => ({
	uploadRoomFiles: uploadRoomFilesMock,
}));

import { useAgentRun } from "./use-agent-run";

const room = {
	options: { modelId: "", harnessType: "AGENT" },
} as unknown as RoomStore;

function snapshot(
	status: AgentRunSnapshot["status"],
	patch: Partial<AgentRunSnapshot> = {},
): AgentRunSnapshot {
	return {
		runId: "run-1",
		roomId: "room-1",
		status,
		pendingActions: [],
		...patch,
	};
}

function eventBase(sequence: number) {
	return {
		version: 1 as const,
		eventId: `event-${sequence}`,
		sequence,
		runId: "run-1",
		timestamp: `2026-09-21T12:00:0${sequence}.000Z`,
	};
}

function renderAgentRun(onSettled = vi.fn(), engine?: string) {
	return renderHook(() =>
		useAgentRun({
			insightId: "insight-1",
			roomId: "room-1",
			agentId: "agent-1",
			room,
			engine,
			onSettled,
		}),
	);
}

describe("useAgentRun", () => {
	beforeEach(() => {
		agentStoreMock.FakeAgentStore.reset();
		uploadRoomFilesMock.mockReset();
		uploadRoomFilesMock.mockResolvedValue([]);
	});

	it("uploads attachments and starts the fixed agent with room runtime options", async () => {
		const file = new File(["contents"], "brief.txt", {
			type: "text/plain",
		});
		uploadRoomFilesMock.mockResolvedValue([
			{ fileName: "brief.txt", fileLocation: "/uploads/brief.txt" },
		]);
		const { result } = renderAgentRun(vi.fn(), "model-1");

		await act(() =>
			result.current.send({ text: "Read this", files: [file] }),
		);

		expect(uploadRoomFilesMock).toHaveBeenCalledWith("insight-1", [file]);
		expect(agentStoreMock.FakeAgentStore.start).toHaveBeenCalledWith(
			{
				roomId: "room-1",
				command: "Read this",
				engine: "model-1",
				harnessType: "AGENT",
				agentId: "agent-1",
				media: ["/uploads/brief.txt"],
			},
			"insight-1",
		);
	});

	it("surfaces upload failures without starting a run", async () => {
		uploadRoomFilesMock.mockRejectedValue(new Error("Upload failed"));
		const { result } = renderAgentRun();

		let failure: unknown;
		await act(async () => {
			try {
				await result.current.send({
					text: "Read this",
					files: [new File(["contents"], "brief.txt")],
				});
			} catch (cause) {
				failure = cause;
			}
		});
		expect(failure).toEqual(new Error("Upload failed"));
		expect(agentStoreMock.FakeAgentStore.start).not.toHaveBeenCalled();
		expect(result.current.status).toBe("FAILED");
		expect(result.current.isSubmitting).toBe(false);
	});

	it("streams progressive items through active and completed phases", async () => {
		const { result } = renderAgentRun();
		await act(() => result.current.send({ text: "Hello", files: [] }));
		const store = agentStoreMock.FakeAgentStore.instances[0];
		const callbacks = store.callbacks;
		expect(result.current.status).toBe("SUBMITTED");
		expect(callbacks).not.toBeNull();
		if (!callbacks) return;

		const startedItem = {
			id: "message-1",
			kind: "message" as const,
			role: "assistant" as const,
			text: "Hel",
		};
		act(() => {
			callbacks.onEvent(
				{
					...eventBase(1),
					type: "item.started",
					item: startedItem,
				},
				{
					itemsById: { [startedItem.id]: startedItem },
					itemOrder: [startedItem.id],
				},
			);
		});
		expect(result.current.itemPhases[startedItem.id]).toBe("active");
		expect(result.current.items.itemsById[startedItem.id]).toMatchObject({
			text: "Hel",
		});

		const updatedItem = { ...startedItem, text: "Hello" };
		act(() => {
			callbacks.onEvent(
				{
					...eventBase(2),
					type: "item.updated",
					itemId: startedItem.id,
					kind: "message",
					delta: "lo",
				},
				{
					itemsById: { [updatedItem.id]: updatedItem },
					itemOrder: [updatedItem.id],
				},
			);
		});
		expect(result.current.itemPhases[updatedItem.id]).toBe("active");
		expect(result.current.items.itemsById[updatedItem.id]).toMatchObject({
			text: "Hello",
		});

		const completedItem = { ...startedItem, text: "Hello" };
		act(() => {
			callbacks.onEvent(
				{
					...eventBase(3),
					type: "item.completed",
					item: completedItem,
				},
				{
					itemsById: { [completedItem.id]: completedItem },
					itemOrder: [completedItem.id],
				},
			);
		});
		expect(result.current.itemPhases[completedItem.id]).toBe("complete");
		expect(result.current.items.itemsById[completedItem.id]).toMatchObject({
			text: "Hello",
		});
	});

	it("reconciles dropped events and refreshes durable pending actions", async () => {
		const { result } = renderAgentRun();
		await act(() => result.current.send({ text: "Use a tool", files: [] }));
		const store = agentStoreMock.FakeAgentStore.instances[0];
		const callbacks = store.callbacks;
		if (!callbacks) throw new Error("Expected a run watcher.");

		let resolveDurable: (value: AgentRunSnapshot) => void = () => undefined;
		store.getSnapshot.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveDurable = resolve;
			}),
		);
		act(() => {
			callbacks.onSnapshot(snapshot("RUNNING"), { droppedEvents: 2 });
		});
		expect(result.current.hasStreamGap).toBe(true);

		const pendingAction: PendingAgentAction = {
			actionId: "action-1",
			runId: "run-1",
			parentMessageId: null,
			toolCallId: "tool-1",
			toolName: "search",
			toolArgs: {},
			editedArgs: null,
			toolMeta: null,
			hasUi: false,
			uiUrl: null,
			status: "PENDING",
		};
		await act(async () => {
			resolveDurable(
				snapshot("INPUT_REQUIRED", {
					pendingActions: [pendingAction],
				}),
			);
			await Promise.resolve();
		});

		expect(result.current.hasStreamGap).toBe(false);
		expect(result.current.status).toBe("INPUT_REQUIRED");
		expect(result.current.pendingActions).toEqual([pendingAction]);
	});

	it("preserves partial items when cancellation settles", async () => {
		const onSettled = vi.fn();
		const { result } = renderAgentRun(onSettled);
		await act(() => result.current.send({ text: "Long task", files: [] }));
		const store = agentStoreMock.FakeAgentStore.instances[0];
		const callbacks = store.callbacks;
		if (!callbacks) throw new Error("Expected a run watcher.");
		const partialItem = {
			id: "message-1",
			kind: "message" as const,
			role: "assistant" as const,
			text: "Partial answer",
		};
		act(() => {
			callbacks.onEvent(
				{
					...eventBase(1),
					type: "item.started",
					item: partialItem,
				},
				{
					itemsById: { [partialItem.id]: partialItem },
					itemOrder: [partialItem.id],
				},
			);
		});

		await act(() => result.current.cancel());
		expect(result.current.status).toBe("CANCELLED");
		expect(result.current.items.itemsById[partialItem.id]).toEqual(
			partialItem,
		);

		act(() => callbacks.onReconcile(store.cancelSnapshot));
		expect(onSettled).toHaveBeenCalledWith(store.cancelSnapshot, "room-1");
	});

	it("protects an in-flight cancellation from duplicate requests", async () => {
		const { result } = renderAgentRun();
		await act(() => result.current.send({ text: "Long task", files: [] }));
		const store = agentStoreMock.FakeAgentStore.instances[0];
		let resolveCancel: (snapshot: AgentRunSnapshot) => void = () =>
			undefined;
		store.cancel.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveCancel = resolve;
			}),
		);

		act(() => {
			void result.current.cancel();
			void result.current.cancel();
		});
		expect(store.cancel).toHaveBeenCalledTimes(1);
		expect(result.current.isCancelling).toBe(true);

		await act(async () => {
			resolveCancel(store.cancelSnapshot);
			await Promise.resolve();
		});
		expect(result.current.isCancelling).toBe(false);
	});

	it("reattaches one watcher to an existing run", () => {
		const { result } = renderAgentRun();
		act(() => result.current.reattach("existing-run"));

		const store = agentStoreMock.FakeAgentStore.instances[0];
		expect(store.runId).toBe("existing-run");
		expect(store.callbacks).not.toBeNull();
		expect(result.current.status).toBe("SUBMITTED");
	});
});
