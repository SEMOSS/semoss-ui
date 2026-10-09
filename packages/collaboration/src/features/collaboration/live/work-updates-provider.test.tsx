import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import {
	COLLABORATION_SAVED,
	useCollaborationResource,
	useWorkUpdates,
} from "./work-updates.context";
import { WorkUpdatesProvider } from "./work-updates-provider";

const topic = (id: string, status = "suggested") => ({
	id,
	name: id,
	status,
	stats: { threads: 8, openItems: 3, lastActivity: null },
});
const response = (items: unknown[], total = items.length) => ({
	pixelReturn: [{ output: { items, total }, operationType: [] }],
});
function setup(run: ReturnType<typeof vi.fn>, scope = "one") {
	const actions = { run } as unknown as InsightActions;
	const initial = {
		...createInitialCollaborationState(),
		topics: [],
		items: [],
		threads: [],
		people: [],
		memories: [],
		reviews: [],
	};
	const wrapper = ({ children }: { children: ReactNode }) => (
		<CollaborationSessionProvider key={scope} initialState={initial}>
			<WorkUpdatesProvider actions={actions}>
				{children}
			</WorkUpdatesProvider>
		</CollaborationSessionProvider>
	);
	const hook = renderHook(
		() => ({
			session: useCollaborationSession(),
			updates: useWorkUpdates(),
			directory: useCollaborationResource("directory"),
			second: useCollaborationResource("directory"),
		}),
		{ wrapper },
	);
	return { ...hook, actions };
}
afterEach(() => vi.useRealTimers());
it("shares one directory read and discovers topics created elsewhere on explicit refresh", async () => {
	const run = vi
		.fn()
		.mockResolvedValueOnce(response([topic("suggested")]))
		.mockResolvedValueOnce(
			response([topic("suggested"), topic("new", "dormant")]),
		);
	const { result } = setup(run);
	await waitFor(() => expect(result.current.directory.complete).toBe(true));
	expect(run).toHaveBeenCalledTimes(1);
	expect(result.current.session.state.topics[0]).toMatchObject({
		status: "suggested",
		stats: { threads: 8, openItems: 3 },
	});
	act(() => result.current.directory.refresh());
	await waitFor(() =>
		expect(result.current.session.state.topics).toHaveLength(2),
	);
	expect(
		run.mock.calls.every(([statement]) =>
			statement.startsWith("BrainListTopics("),
		),
	).toBe(true);
});
it("retains visible topics after failures and incomplete pages", async () => {
	const run = vi
		.fn()
		.mockResolvedValueOnce(response([topic("saved")]))
		.mockResolvedValueOnce(response([topic("partial")], 2))
		.mockRejectedValueOnce(new Error("Offline"));
	const { result } = setup(run);
	await waitFor(() => expect(result.current.directory.complete).toBe(true));
	act(() => result.current.directory.refresh());
	await waitFor(() => expect(result.current.directory.error).toBe("Offline"));
	expect(result.current.session.state.topics.map((row) => row.id)).toEqual([
		"saved",
	]);
	run.mockResolvedValue(response([]));
	act(() => result.current.directory.refresh());
	await waitFor(() =>
		expect(result.current.session.state.topics).toEqual([]),
	);
});
it("preserves local edits and deletions made during a directory refresh", async () => {
	let finish: (value: ReturnType<typeof response>) => void = () => undefined;
	const run = vi
		.fn()
		.mockResolvedValueOnce(response([topic("edit"), topic("delete")]))
		.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		);
	const { result } = setup(run);
	await waitFor(() => expect(result.current.directory.complete).toBe(true));
	act(() => result.current.directory.refresh());
	await waitFor(() => expect(run).toHaveBeenCalledTimes(2));
	act(() => {
		result.current.session.dispatch({
			type: "topic.save",
			topic: { id: "edit", name: "Local title" },
		});
		result.current.session.dispatch({
			type: "topic.delete",
			topicId: "delete",
		});
	});
	await act(async () =>
		finish(response([topic("edit"), topic("delete"), topic("new")])),
	);
	expect(result.current.session.state.topics.map((row) => row.name)).toEqual([
		"Local title",
		"new",
	]);
});
it("does not refresh ordinary collections on elapsed timers or window focus", async () => {
	const run = vi.fn().mockResolvedValue(response([topic("saved")]));
	const { result } = setup(run);
	await waitFor(() => expect(result.current.directory.complete).toBe(true));
	vi.useFakeTimers();
	act(() => {
		vi.advanceTimersByTime(120000);
		window.dispatchEvent(new Event("focus"));
		document.dispatchEvent(new Event("visibilitychange"));
	});
	expect(run).toHaveBeenCalledTimes(1);
});
it("does not share cached rows between account owners", async () => {
	const run = vi.fn().mockResolvedValue(response([topic("private")]));
	const first = setup(run);
	await waitFor(() =>
		expect(first.result.current.directory.complete).toBe(true),
	);
	first.unmount();
	const second = setup(
		vi.fn(() => new Promise(() => {})),
		"two",
	);
	expect(second.result.current.session.state.topics).toEqual([]);
	expect(second.result.current.directory.isLoading).toBe(true);
});

it("refreshes only affected loaded resources after a confirmed save and ignores another account", async () => {
	const run = vi.fn(async (statement: string) =>
		statement.includes("topicId=") &&
		statement.startsWith("BrainListTopics")
			? {
					pixelReturn: [
						{
							output: { ...topic("one"), goals: [], people: [] },
							operationType: [],
						},
					],
				}
			: response(
					statement.startsWith("BrainListTopics")
						? [topic("one"), topic("two")]
						: [],
				),
	);
	const { result, actions } = setup(run);
	await waitFor(() => expect(result.current.directory.complete).toBe(true));
	await act(() => result.current.updates?.loadResource?.("topic:one"));
	await act(() =>
		result.current.updates?.loadResource?.("topic-context:two"),
	);
	run.mockClear();
	await act(async () =>
		window.dispatchEvent(
			new CustomEvent(COLLABORATION_SAVED, {
				detail: {
					actions,
					commands: [
						{
							type: "topic.save",
							topic: { id: "one", name: "Renamed" },
						},
					],
				},
			}),
		),
	);
	await waitFor(() => expect(run).toHaveBeenCalledTimes(2));
	expect(run.mock.calls.map(([statement]) => statement)).toEqual(
		expect.arrayContaining([
			"BrainListTopics(limit=[100], offset=[0]);",
			'BrainListTopics(topicId=["one"]);',
		]),
	);
	run.mockClear();
	await act(async () =>
		window.dispatchEvent(
			new CustomEvent(COLLABORATION_SAVED, {
				detail: {
					actions: {},
					commands: [{ type: "topic.save", topic: { id: "one" } }],
				},
			}),
		),
	);
	expect(run).not.toHaveBeenCalled();
});
