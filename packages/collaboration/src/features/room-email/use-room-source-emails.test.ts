import { act, renderHook, waitFor } from "@testing-library/react";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import type { RoomSource } from "@/features/rooms/source-import/room-source";
import type { InsightActions } from "@/lib/pixel";
import { loadRoomSourceEmails } from "./load-room-source-emails";
import type { RoomEmailSession } from "./room-email.context";
import { useRoomSourceEmails } from "./use-room-source-emails";

vi.mock("./load-room-source-emails", () => ({
	loadRoomSourceEmails: vi.fn(),
}));

const loadEmails = vi.mocked(loadRoomSourceEmails);

function source(id: string): RoomSource {
	return {
		version: 1,
		threadId: `thread-${id}`,
		title: `Email ${id}`,
		channel: "email",
		kind: "outlook",
		nativeId: id,
		file: { fileName: `${id}.md`, fileLocation: `${id}.md` },
		messages: [{ id, at: "2026-10-07T12:00:00Z" }],
	};
}

function owner(id: string) {
	const release = vi.fn();
	const session: RoomEmailSession = {
		insight: {
			insightId: `insight-${id}`,
			actions: { run: vi.fn() } as unknown as InsightActions,
		},
		retain: vi.fn(() => release),
		readEmailAttachment: vi.fn(),
	};
	return { session, release };
}

function message(id: string): WorkspaceMessage {
	return {
		id,
		fromId: "sender",
		at: "2026-10-07T12:00:00Z",
		text: `Body for ${id}`,
	};
}

function pendingRead() {
	let resolve: (messages: WorkspaceMessage[]) => void = () => undefined;
	let reject: (error: Error) => void = () => undefined;
	const promise = new Promise<WorkspaceMessage[]>(
		(resolveRead, rejectRead) => {
			resolve = resolveRead;
			reject = rejectRead;
		},
	);
	return { promise, resolve, reject };
}

beforeEach(() => {
	loadEmails.mockReset();
});

it("ignores room A's late result after switching to room B and retains each read until completion", async () => {
	const first = owner("a");
	const second = owner("b");
	const sourceA = source("a");
	const sourceB = source("b");
	const readA = pendingRead();
	const readB = pendingRead();
	loadEmails
		.mockReturnValueOnce(readA.promise)
		.mockReturnValueOnce(readB.promise);
	const { result, rerender } = renderHook(
		(props) => useRoomSourceEmails(props.session, props.source, true),
		{ initialProps: { session: first.session, source: sourceA } },
	);
	expect(first.session.retain).toHaveBeenCalledOnce();
	expect(result.current.isSourceLoading).toBe(true);
	rerender({ session: second.session, source: sourceB });
	expect(result.current.sourceMessages).toEqual([]);
	expect(result.current.sourceError).toBeNull();
	expect(result.current.isSourceLoading).toBe(true);
	expect(first.release).not.toHaveBeenCalled();
	expect(second.session.retain).toHaveBeenCalledOnce();
	expect(loadEmails).toHaveBeenNthCalledWith(
		1,
		first.session.insight.actions,
		sourceA,
	);
	expect(loadEmails).toHaveBeenNthCalledWith(
		2,
		second.session.insight.actions,
		sourceB,
	);
	await act(async () => readB.resolve([message("b")]));
	expect(result.current.sourceMessages).toEqual([message("b")]);
	expect(result.current.isSourceLoading).toBe(false);
	expect(second.release).toHaveBeenCalledOnce();
	await act(async () => readA.resolve([message("a")]));
	expect(first.release).toHaveBeenCalledOnce();
	expect(result.current.sourceMessages).toEqual([message("b")]);
	expect(result.current.sourceError).toBeNull();
	expect(result.current.isSourceLoading).toBe(false);
});

it("keeps an unmounted read retained until its rejection settles", async () => {
	const { session, release } = owner("a");
	const read = pendingRead();
	const sourceA = source("a");
	loadEmails.mockReturnValueOnce(read.promise);
	const view = renderHook(() => useRoomSourceEmails(session, sourceA, true));
	view.unmount();
	expect(release).not.toHaveBeenCalled();
	await act(async () => read.reject(new Error("No longer available")));
	expect(release).toHaveBeenCalledOnce();
});

it("clears a failed read on explicit retry and releases both operations", async () => {
	const { session, release } = owner("a");
	const sourceA = source("a");
	const retry = pendingRead();
	loadEmails
		.mockRejectedValueOnce(new Error("Email unavailable"))
		.mockReturnValueOnce(retry.promise);
	const { result } = renderHook(() =>
		useRoomSourceEmails(session, sourceA, true),
	);
	await waitFor(() =>
		expect(result.current.sourceError).toBe("Email unavailable"),
	);
	expect(result.current.sourceMessages).toEqual([]);
	expect(result.current.isSourceLoading).toBe(false);
	expect(release).toHaveBeenCalledOnce();
	act(() => result.current.reloadSource());
	expect(loadEmails).toHaveBeenCalledTimes(2);
	expect(session.retain).toHaveBeenCalledTimes(2);
	expect(result.current.sourceError).toBeNull();
	expect(result.current.isSourceLoading).toBe(true);
	await act(async () => retry.resolve([message("a")]));
	expect(result.current.sourceMessages).toEqual([message("a")]);
	expect(result.current.isSourceLoading).toBe(false);
	expect(release).toHaveBeenCalledTimes(2);
});

it.each<{ label: string; source: RoomSource | null; isReady: boolean }>([
	{ label: "no source", source: null, isReady: true },
	{
		label: "calendar source",
		source: { ...source("a"), channel: "calendar", kind: "calendar" },
		isReady: true,
	},
	{
		label: "empty included emails",
		source: { ...source("a"), messages: [] },
		isReady: true,
	},
	{ label: "room not ready", source: source("a"), isReady: false },
	{
		label: "sample source",
		source: { ...source("a"), kind: "sample" },
		isReady: true,
	},
])("does not load or retain for $label", ({ source: roomSource, isReady }) => {
	const { session } = owner("a");
	const { result } = renderHook(() =>
		useRoomSourceEmails(session, roomSource, isReady),
	);
	act(() => result.current.reloadSource());
	expect(loadEmails).not.toHaveBeenCalled();
	expect(session.retain).not.toHaveBeenCalled();
	expect(result.current.sourceMessages).toEqual([]);
	expect(result.current.sourceError).toBeNull();
	expect(result.current.isSourceLoading).toBe(false);
});

it("does not reload for unrelated rerenders during or after a read", async () => {
	const { session } = owner("a");
	const sourceA = source("a");
	const read = pendingRead();
	loadEmails.mockReturnValueOnce(read.promise);
	const { result, rerender } = renderHook(() =>
		useRoomSourceEmails(session, sourceA, true),
	);
	const reload = result.current.reloadSource;
	rerender();
	expect(loadEmails).toHaveBeenCalledOnce();
	await act(async () => read.resolve([message("a")]));
	rerender();
	expect(loadEmails).toHaveBeenCalledOnce();
	expect(session.retain).toHaveBeenCalledOnce();
	expect(result.current.sourceMessages).toEqual([message("a")]);
	expect(result.current.reloadSource).toBe(reload);
});
