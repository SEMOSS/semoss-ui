import { act, renderHook, waitFor } from "@testing-library/react";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import type { RoomSource } from "@/features/rooms/source-import/room-source";
import type { SourceEmailDraft } from "@/features/rooms/source-import/source-thread-file";
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
		updateSourceFile: vi.fn().mockResolvedValue(undefined),
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
		true,
	);
	expect(loadEmails).toHaveBeenNthCalledWith(
		2,
		second.session.insight.actions,
		sourceB,
		true,
	);
	await act(async () => readB.resolve([message("b")]));
	expect(result.current.sourceMessages).toEqual([message("b")]);
	expect(result.current.isSourceLoading).toBe(false);
	expect(second.release).toHaveBeenCalledOnce();
	await act(async () => readA.resolve([message("a")]));
	expect(first.release).toHaveBeenCalledOnce();
	expect(first.session.updateSourceFile).not.toHaveBeenCalled();
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
		label: "empty Outlook source without a saved identity",
		source: { ...source("a"), nativeId: undefined, messages: [] },
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

it("refreshes incoming replies while visible, keeps the file identity, and skips unchanged writes", async () => {
	vi.useFakeTimers();
	const visibility = vi
		.spyOn(document, "visibilityState", "get")
		.mockReturnValue("visible");
	try {
		const { session } = owner("a");
		const original = {
			...source("a"),
			kind: "brain" as const,
			webLink: "https://outlook.office.com/mail/a",
		};
		loadEmails
			.mockResolvedValueOnce([message("a")])
			.mockResolvedValue([message("a"), message("reply")]);
		const onUpdated = vi.fn();
		const view = renderHook(
			({ roomSource }) =>
				useRoomSourceEmails(session, roomSource, true, [], onUpdated),
			{ initialProps: { roomSource: original } },
		);
		await act(async () => undefined);
		expect(loadEmails).toHaveBeenCalledOnce();
		expect(session.updateSourceFile).toHaveBeenCalledTimes(1);
		await act(() => vi.advanceTimersByTimeAsync(30_000));
		expect(
			view.result.current.sourceMessages.map((item) => item.id),
		).toEqual(["a", "reply"]);
		expect(session.updateSourceFile).toHaveBeenLastCalledWith(
			expect.objectContaining({
				file: original.file,
				nativeId: "a",
				webLink: original.webLink,
				messages: [
					expect.objectContaining({ id: "a" }),
					expect.objectContaining({ id: "reply" }),
				],
			}),
			expect.stringContaining("Body for reply"),
		);
		expect(onUpdated).toHaveBeenLastCalledWith("a.md");
		view.rerender({
			roomSource: {
				...original,
				messages: [
					{ id: "a", at: "2026-10-07T12:00:00Z" },
					{ id: "reply", at: "2026-10-07T12:00:00Z" },
				],
			},
		});
		expect(loadEmails).toHaveBeenCalledTimes(2);
		await act(() => vi.advanceTimersByTimeAsync(30_000));
		expect(session.updateSourceFile).toHaveBeenCalledTimes(2);
		visibility.mockReturnValue("hidden");
		await act(() => vi.advanceTimersByTimeAsync(30_000));
		expect(loadEmails).toHaveBeenCalledTimes(3);
		view.unmount();
		visibility.mockReturnValue("visible");
		await act(() => vi.advanceTimersByTimeAsync(30_000));
		expect(loadEmails).toHaveBeenCalledTimes(3);
	} finally {
		visibility.mockRestore();
		vi.useRealTimers();
	}
});

it("updates draft contents and send status without reloading the source or submitting chat", async () => {
	vi.useFakeTimers();
	try {
		const { session } = owner("a");
		const original = source("a");
		loadEmails.mockResolvedValue([message("a")]);
		const drafts: SourceEmailDraft[] = [];
		const view = renderHook(
			({ drafts }) =>
				useRoomSourceEmails(session, original, true, drafts),
			{ initialProps: { drafts } },
		);
		await act(async () => undefined);
		const draft: SourceEmailDraft = {
			id: "draft",
			replyTo: "a",
			status: "draft",
			subject: "Reply",
			to: "sender@example.com",
			cc: "",
			bcc: "",
			body: "My reply",
			attachments: [],
		};
		view.rerender({ drafts: [draft] });
		await act(() => vi.advanceTimersByTimeAsync(300));
		expect(session.updateSourceFile).toHaveBeenLastCalledWith(
			expect.anything(),
			expect.stringContaining("My reply"),
		);
		view.rerender({ drafts: [{ ...draft, status: "sent" }] });
		await act(() => vi.advanceTimersByTimeAsync(300));
		expect(session.updateSourceFile).toHaveBeenLastCalledWith(
			expect.anything(),
			expect.stringContaining("Sent"),
		);
		expect(loadEmails).toHaveBeenCalledOnce();
		expect(session.insight.actions.run).not.toHaveBeenCalled();
		view.unmount();
	} finally {
		vi.useRealTimers();
	}
});

it("surfaces a file refresh failure and retries without losing readable source messages", async () => {
	const { session } = owner("a");
	const original = source("a");
	loadEmails.mockResolvedValue([message("a")]);
	vi.mocked(session.updateSourceFile).mockRejectedValueOnce(
		new Error("The source file could not be saved."),
	);
	const { result } = renderHook(() =>
		useRoomSourceEmails(session, original, true),
	);
	await waitFor(() =>
		expect(result.current.sourceError).toBe(
			"The source file could not be saved.",
		),
	);
	expect(result.current.sourceMessages).toEqual([message("a")]);
	act(() => result.current.reloadSource());
	await waitFor(() => expect(result.current.sourceError).toBeNull());
	expect(session.updateSourceFile).toHaveBeenCalledTimes(2);
});

it("queues a reverted draft behind an older pending file write", async () => {
	vi.useFakeTimers();
	try {
		const { session } = owner("a");
		const original = source("a");
		loadEmails.mockResolvedValue([message("a")]);
		const draft: SourceEmailDraft = {
			id: "draft",
			replyTo: "a",
			status: "draft",
			subject: "Reply",
			to: "sender@example.com",
			cc: "",
			bcc: "",
			body: "Original reply",
			attachments: [],
		};
		const view = renderHook(
			({ drafts }) =>
				useRoomSourceEmails(session, original, true, drafts),
			{ initialProps: { drafts: [draft] } },
		);
		await act(async () => undefined);
		const pending = pendingRead();
		vi.mocked(session.updateSourceFile)
			.mockImplementationOnce(() => pending.promise.then(() => undefined))
			.mockImplementationOnce(() =>
				pending.promise.then(() => undefined),
			);
		view.rerender({ drafts: [{ ...draft, body: "Later revision" }] });
		await act(() => vi.advanceTimersByTimeAsync(300));
		expect(session.updateSourceFile).toHaveBeenCalledTimes(2);
		view.rerender({ drafts: [draft] });
		await act(() => vi.advanceTimersByTimeAsync(300));
		expect(session.updateSourceFile).toHaveBeenCalledTimes(3);
		expect(session.updateSourceFile).toHaveBeenLastCalledWith(
			expect.anything(),
			expect.stringContaining("Original reply"),
		);
		await act(async () => pending.resolve([]));
		view.unmount();
	} finally {
		vi.useRealTimers();
	}
});

it("retains a failed source-refresh warning when only the local draft file write succeeds", async () => {
	vi.useFakeTimers();
	try {
		const { session } = owner("a");
		const original = source("a");
		loadEmails
			.mockResolvedValueOnce([message("a")])
			.mockRejectedValueOnce(new Error("Latest replies unavailable"));
		const drafts: SourceEmailDraft[] = [];
		const view = renderHook(
			({ drafts }) =>
				useRoomSourceEmails(session, original, true, drafts),
			{ initialProps: { drafts } },
		);
		await act(async () => undefined);
		await act(async () => view.result.current.reloadSource());
		expect(view.result.current.sourceError).toBe(
			"Latest replies unavailable",
		);
		view.rerender({
			drafts: [
				{
					id: "draft",
					replyTo: "a",
					status: "draft",
					subject: "Reply",
					to: "sender@example.com",
					cc: "",
					bcc: "",
					body: "Current reply",
					attachments: [],
				},
			],
		});
		await act(() => vi.advanceTimersByTimeAsync(300));
		expect(session.updateSourceFile).toHaveBeenLastCalledWith(
			expect.anything(),
			expect.stringContaining("Current reply"),
		);
		expect(view.result.current.sourceError).toBe(
			"Latest replies unavailable",
		);
		view.unmount();
	} finally {
		vi.useRealTimers();
	}
});

it.each(["brain", "outlook"] as const)(
	"can restore a %s source after all its envelopes were excluded",
	async (kind) => {
		const { session } = owner("a");
		const original = { ...source("a"), kind, messages: [] };
		loadEmails.mockResolvedValue([message("a")]);
		const { result } = renderHook(() =>
			useRoomSourceEmails(session, original, true),
		);
		await waitFor(() =>
			expect(result.current.sourceMessages).toEqual([message("a")]),
		);
		expect(session.updateSourceFile).toHaveBeenCalledWith(
			expect.objectContaining({
				messages: [expect.objectContaining({ id: "a" })],
			}),
			expect.any(String),
		);
	},
);
