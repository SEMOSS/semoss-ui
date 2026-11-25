import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { deferred } from "@/features/onboarding/topic-review.test-fixtures";
import {
	linkRoomTopic,
	listRoomTopics,
	type RoomTopic,
} from "./api/room-topics";
import { linkedTopics, useRoomTopics } from "./use-room-topics";

vi.mock("./api/room-topics", () => ({
	listRoomTopics: vi.fn(),
	linkRoomTopic: vi.fn(),
}));
vi.mock("@/features/collaboration/live/work-updates.context", () => ({
	useRecordIds: () => ({
		serverId: async (id: string) => id,
		localId: (id: string) => id,
	}),
}));
const insight = vi.hoisted(() => ({ actions: {} }));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

const read = vi.mocked(listRoomTopics);
const link = vi.mocked(linkRoomTopic);

const topic = (
	topicId: string,
	state: RoomTopic["state"] = "linked",
): RoomTopic => ({ topicId, name: `Topic ${topicId}`, state });

it("reads the chat's topics, and every linked one is kept in the server's order", async () => {
	read.mockResolvedValue([
		topic("t1", "suggested"),
		topic("t2"),
		topic("t3"),
	]);
	const { result } = renderHook(() => useRoomTopics("room-a", false));
	await waitFor(() => expect(result.current.topics).toHaveLength(3));
	expect(linkedTopics(result.current.topics).map((t) => t.topicId)).toEqual([
		"t2",
		"t3",
	]);
});

it("has no linked topic when the chat has none, or when its topics could not be read", async () => {
	expect(linkedTopics(null)).toEqual([]);
	expect(
		linkedTopics([topic("t1", "suggested"), topic("t2", "dismissed")]),
	).toEqual([]);
	read.mockRejectedValue(new Error("not your chat"));
	const { result } = renderHook(() => useRoomTopics("room-a", false));
	await waitFor(() => expect(read).toHaveBeenCalled());
	expect(result.current.topics).toBeNull();
});

it("never shows the last chat's topics in the next chat, and ignores an old chat's late answer", async () => {
	const late = deferred<RoomTopic[]>();
	read.mockResolvedValueOnce([topic("a-topic")]);
	const { result, rerender } = renderHook(
		({ roomId }) => useRoomTopics(roomId, false),
		{ initialProps: { roomId: "room-a" } },
	);
	await waitFor(() =>
		expect(result.current.topics).toEqual([topic("a-topic")]),
	);

	read.mockReturnValueOnce(late.promise);
	rerender({ roomId: "room-b" });
	expect(result.current.topics).toBeNull();

	read.mockResolvedValueOnce([topic("c-topic")]);
	rerender({ roomId: "room-c" });
	await waitFor(() =>
		expect(result.current.topics).toEqual([topic("c-topic")]),
	);
	await act(async () => late.resolve([topic("stale-topic")]));
	expect(result.current.topics).toEqual([topic("c-topic")]);
});

it("links a topic to the chat or takes it off, and shows the answer", async () => {
	read.mockResolvedValue([topic("t1")]);
	link.mockResolvedValue([]);
	const { result } = renderHook(() => useRoomTopics("room-a", false));
	await waitFor(() => expect(result.current.topics).toHaveLength(1));
	await act(async () => result.current.change("t1", true));
	expect(link).toHaveBeenCalledWith(insight.actions, "room-a", "t1", true);
	expect(result.current.topics).toEqual([]);
});

it("keeps the topics it had when a later read fails, so a network error does not take the topic away", async () => {
	read.mockResolvedValueOnce([topic("t1")]);
	const { result, rerender } = renderHook(() =>
		useRoomTopics("room-a", false),
	);
	await waitFor(() => expect(result.current.topics).toEqual([topic("t1")]));

	const readsSoFar = read.mock.calls.length;
	read.mockRejectedValue(new Error("network"));
	// a new insight session makes the hook read again
	insight.actions = {};
	rerender();
	await waitFor(() =>
		expect(read.mock.calls.length).toBeGreaterThan(readsSoFar),
	);
	await act(async () => undefined);

	expect(result.current.topics).toEqual([topic("t1")]);
});
