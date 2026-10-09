import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { WorkUpdatesProvider } from "@/features/collaboration/live/work-updates-provider";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type {
	CollaborationState,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import { readTopic, readTopicItems } from "./api/topic-api";
import { directItem, savedTopic } from "./topic-test-fixtures";
import { useTopicWork } from "./use-topic-work";

const mocks = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: mocks.actions }),
}));
vi.mock("./api/topic-api", () => ({
	readTopic: vi.fn(),
	readTopicItems: vi.fn(),
}));

beforeEach(() => {
	vi.resetAllMocks();
	mocks.actions.run.mockImplementation(async (statement: string) => ({
		pixelReturn: [
			{
				output: statement.startsWith("BrainListTopics")
					? { items: [savedTopic], total: 1 }
					: { items: [], total: 0 },
				operationType: [],
			},
		],
	}));
	vi.mocked(readTopic).mockResolvedValue(savedTopic);
	vi.mocked(readTopicItems).mockResolvedValue([directItem]);
});

function setup(
	state: CollaborationState = {
		...createInitialCollaborationState(),
		topics: [savedTopic],
		items: [],
		threads: [],
	},
) {
	return renderHook(
		({ topicId, tab }) => ({
			work: useTopicWork(topicId, tab),
			session: useCollaborationSession(),
		}),
		{
			initialProps: { topicId: savedTopic.id, tab: "overview" },
			wrapper: ({ children }: { children: ReactNode }) => (
				<CollaborationSessionProvider initialState={state}>
					<WorkUpdatesProvider actions={mocks.actions as never}>
						{children}
					</WorkUpdatesProvider>
				</CollaborationSessionProvider>
			),
		},
	);
}

it("loads a missing deep-linked topic beyond the directory and accepts direct tasks without a source", async () => {
	const { result } = setup({
		...createInitialCollaborationState(),
		topics: [],
		items: [],
		threads: [],
	});
	await waitFor(() => expect(result.current.work.isComplete).toBe(true));
	expect(result.current.work.items).toEqual([directItem]);
	expect(result.current.session.state.topics[0].id).toBe(savedTopic.id);
	expect(result.current.work.error).toBeNull();
});

it("updates from shared task decisions and preserves edits made while a refresh is pending", async () => {
	const { result } = setup();
	await waitFor(() => expect(result.current.work.isComplete).toBe(true));
	let finish: (items: WorkItem[]) => void = () => undefined;
	vi.mocked(readTopicItems).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	act(() => result.current.work.refresh());
	await waitFor(() => expect(readTopicItems).toHaveBeenCalledTimes(2));
	act(() =>
		result.current.session.dispatch({
			type: "item.received",
			item: { ...directItem, status: "done" },
		}),
	);
	expect(result.current.work.items[0].status).toBe("done");
	await act(async () => {
		finish([directItem]);
	});
	await waitFor(() => expect(result.current.work.isComplete).toBe(true));
	expect(result.current.work.items[0].status).toBe("done");
});

it("retains loaded pages after a continuation error and retries without replacing a sample topic", async () => {
	vi.mocked(readTopicItems).mockImplementationOnce(
		async (_actions, _topicId, onPage) => {
			onPage([directItem]);
			throw new Error("Continuation failed");
		},
	);
	const { result } = setup();
	await waitFor(() =>
		expect(result.current.work.error).toBe("Continuation failed"),
	);
	expect(result.current.work.isComplete).toBe(false);
	expect(result.current.work.items).toEqual([directItem]);
	act(() => result.current.work.refresh());
	await waitFor(() => expect(result.current.work.isComplete).toBe(true));
	expect(result.current.work.error).toBeNull();
});

it("does not load backend data for isolated sample topics", () => {
	const { result } = setup({
		...createInitialCollaborationState(),
		topics: [{ ...savedTopic, isSample: true }],
		items: [{ ...directItem, isSample: true }],
	});
	expect(result.current.work.isComplete).toBe(true);
	expect(result.current.work.isLoading).toBe(false);
	expect(readTopicItems).not.toHaveBeenCalled();
});

it("ignores results for a topic after navigation", async () => {
	let finish: (items: WorkItem[]) => void = () => undefined;
	vi.mocked(readTopicItems).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	const { result, rerender } = setup();
	await waitFor(() => expect(readTopicItems).toHaveBeenCalledOnce());
	vi.mocked(readTopic).mockResolvedValue({ ...savedTopic, id: "other" });
	vi.mocked(readTopicItems).mockResolvedValue([]);
	rerender({ topicId: "other", tab: "overview" });
	await waitFor(() => expect(result.current.work.isComplete).toBe(true));
	await act(async () => {
		finish([directItem]);
	});
	expect(result.current.session.state.items).toEqual([directItem]);
	expect(result.current.work.items).toEqual([]);
});

it("loads context only when selected and reuses it on revisits", async () => {
	const { result, rerender } = setup();
	await waitFor(() => expect(result.current.work.isComplete).toBe(true));
	expect(
		mocks.actions.run.mock.calls.filter(([statement]) =>
			statement.startsWith("BrainListPeople"),
		),
	).toHaveLength(0);
	rerender({ topicId: savedTopic.id, tab: "context" });
	await waitFor(() => expect(result.current.work.isComplete).toBe(true));
	const reads = mocks.actions.run.mock.calls.length;
	rerender({ topicId: savedTopic.id, tab: "rooms" });
	rerender({ topicId: savedTopic.id, tab: "context" });
	await act(async () => {});
	expect(mocks.actions.run).toHaveBeenCalledTimes(reads);
	expect(readTopicItems).toHaveBeenCalledTimes(1);
});

it("keeps loaded detail available to an open editor while refreshing or after failure", async () => {
	const { result } = setup();
	await waitFor(() => expect(result.current.work.hasDetails).toBe(true));
	let fail: (cause: Error) => void = () => undefined;
	vi.mocked(readTopic).mockReturnValueOnce(
		new Promise((_resolve, reject) => {
			fail = reject;
		}),
	);
	act(() => result.current.work.refresh());
	await waitFor(() => expect(result.current.work.isDetailLoading).toBe(true));
	expect(result.current.work.hasDetails).toBe(true);
	await act(async () => fail(new Error("Offline")));
	expect(result.current.work.hasDetails).toBe(true);
	expect(result.current.work.error).toBe("Offline");
});
