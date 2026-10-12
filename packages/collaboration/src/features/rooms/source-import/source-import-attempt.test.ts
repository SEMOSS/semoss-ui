import type { InsightActions } from "@/lib/pixel";
import {
	sourceDocument,
	sourceImportState,
} from "./source-import.test-fixtures";
import { createSourceImportAttempt } from "./source-import-attempt";

const mocks = vi.hoisted(() => ({
	load: vi.fn(),
	upload: vi.fn(),
	createSession: vi.fn(),
	listRooms: vi.fn(),
	link: vi.fn(),
	association: vi.fn(),
}));
vi.mock("./load-source-thread", () => ({ loadSourceThread: mocks.load }));
vi.mock("../api/read-room-source-association", () => ({
	readRoomSourceAssociation: mocks.association,
}));
vi.mock("../api/room-threads", () => ({
	listThreadRooms: mocks.listRooms,
	linkRoomThread: mocks.link,
}));
vi.mock("../api/upload-room-files", () => ({ uploadRoomFiles: mocks.upload }));
vi.mock("../room-session", () => ({ createRoomSession: mocks.createSession }));

function setup() {
	const order: string[] = [];
	const release = vi.fn();
	let roomId = "";
	const session = {
		insight: { insightId: "isolated-room-insight" },
		getSnapshot: () => ({ roomId }),
		dispose: vi.fn(),
		retain: vi.fn(() => release),
		initialize: vi.fn(async () => {
			order.push("initialize");
		}),
		create: vi.fn(async () => {
			order.push("create-bind");
			roomId = "new-room";
			return "new-room";
		}),
		setSource: vi.fn(async () => {
			order.push("source");
		}),
	};
	mocks.createSession.mockReturnValue(session);
	mocks.load.mockImplementation(async () => {
		order.push("read");
		return sourceDocument();
	});
	mocks.upload.mockImplementation(async () => {
		order.push("upload");
		return [{ fileLocation: "/saved.md", fileName: "saved.md" }];
	});
	const attempt = createSourceImportAttempt(
		"owner-insight",
		"source-one",
		{} as InsightActions,
		sourceImportState,
	);
	const leave = attempt.retain();
	return { attempt, session, order, leave, release };
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.listRooms.mockResolvedValue([]);
	mocks.link.mockResolvedValue(undefined);
	mocks.association.mockResolvedValue({
		threadId: "source-one",
		isDelegation: false,
	});
});

it("reads, binds a fresh room, uploads to its isolated insight, and persists the receipt", async () => {
	const { attempt, session, order, release } = setup();
	await expect(attempt.start()).resolves.toEqual({
		roomId: "new-room",
		file: { fileLocation: "/saved.md", fileName: "saved.md" },
	});
	expect(order).toEqual([
		"read",
		"initialize",
		"create-bind",
		"upload",
		"source",
	]);
	expect(mocks.upload).toHaveBeenCalledWith("isolated-room-insight", [
		expect.any(File),
	]);
	expect(session.setSource).toHaveBeenCalledWith(
		expect.objectContaining({
			threadId: "source-one",
			file: { fileLocation: "/saved.md", fileName: "saved.md" },
		}),
	);
	expect(attempt.getSnapshot()).toMatchObject({
		phase: "ready",
		roomId: "new-room",
	});
	expect(release).toHaveBeenCalledOnce();
});

it("joins Strict Mode activation and repeated starts into one transaction", async () => {
	const { attempt, leave, session } = setup();
	const first = attempt.start();
	leave();
	const leaveAgain = attempt.retain();
	const second = attempt.start();
	expect(second).toBe(first);
	await first;
	expect(session.create).toHaveBeenCalledOnce();
	expect(mocks.upload).toHaveBeenCalledOnce();
	leaveAgain();
});

it("retries the same room without uploading a confirmed file twice", async () => {
	const { attempt, session } = setup();
	session.setSource.mockRejectedValueOnce(
		new Error("Could not save source metadata"),
	);
	await expect(attempt.start()).resolves.toBeNull();
	expect(attempt.getSnapshot().error).toBe("Could not save source metadata");
	await expect(attempt.start()).resolves.toEqual({
		roomId: "new-room",
		file: { fileLocation: "/saved.md", fileName: "saved.md" },
	});
	expect(mocks.createSession).toHaveBeenCalledOnce();
	expect(mocks.load).toHaveBeenCalledOnce();
	expect(mocks.upload).toHaveBeenCalledOnce();
	expect(session.setSource).toHaveBeenCalledTimes(2);
});

it("does not create a room after the source route has been left", async () => {
	const { attempt, leave, session } = setup();
	let finish:
		| ((value: ReturnType<typeof sourceDocument>) => void)
		| undefined;
	mocks.load.mockReturnValue(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	const pending = attempt.start();
	leave();
	finish?.(sourceDocument());
	await expect(pending).resolves.toBeNull();
	expect(session.create).not.toHaveBeenCalled();
	expect(mocks.upload).not.toHaveBeenCalled();
});

it("retains a saved file receipt but does not activate a room after navigation", async () => {
	const { attempt, leave, session } = setup();
	mocks.upload.mockImplementation(async () => {
		leave();
		return [{ fileLocation: "/saved.md", fileName: "saved.md" }];
	});
	await expect(attempt.start()).resolves.toBeNull();
	expect(session.setSource).not.toHaveBeenCalled();
});

it("a later source activation allocates its own room session", async () => {
	const first = setup();
	await first.attempt.start();
	const second = setup();
	await second.attempt.start();
	expect(mocks.createSession).toHaveBeenCalledTimes(2);
});

it("concurrent visits to the same source share the pending import", async () => {
	const first = setup();
	const pending = first.attempt.start();
	const again = createSourceImportAttempt(
		"owner-insight",
		"source-one",
		{} as InsightActions,
		sourceImportState,
	);
	const leaveAgain = again.retain();
	first.leave();
	expect(again).toBe(first.attempt);
	expect(again.start()).toBe(pending);
	await pending;
	expect(mocks.createSession).toHaveBeenCalledOnce();
	leaveAgain();
});

it("releases an abandoned insight when navigation happens before room allocation", async () => {
	const { attempt, leave, session } = setup();
	session.initialize.mockImplementation(async () => {
		leave();
	});
	await expect(attempt.start()).resolves.toBeNull();
	expect(session.create).not.toHaveBeenCalled();
	expect(session.dispose).toHaveBeenCalledOnce();
});

it("reopens the newest chat opened from the thread without reading or creating", async () => {
	mocks.listRooms.mockResolvedValue([
		{ roomId: "topic-chat", origin: "you" },
		{ roomId: "thread-chat", origin: "thread" },
		{ roomId: "older-thread-chat", origin: "thread" },
	]);
	const { attempt } = setup();
	await expect(attempt.start()).resolves.toEqual({ roomId: "thread-chat" });
	expect(mocks.listRooms).toHaveBeenCalledWith({}, "source-one");
	expect(attempt.getSnapshot()).toMatchObject({
		phase: "ready",
		roomId: "thread-chat",
	});
	expect(mocks.load).not.toHaveBeenCalled();
	expect(mocks.createSession).not.toHaveBeenCalled();
	expect(mocks.link).not.toHaveBeenCalled();
});

it("skips a chat opened from the thread that has no readable source of it", async () => {
	mocks.listRooms.mockResolvedValue([
		{ roomId: "legacy-chat", origin: "thread" },
		{ roomId: "broken-chat", origin: "thread" },
		{ roomId: "source-chat", origin: "thread" },
	]);
	mocks.association.mockImplementation(async (_actions, roomId: string) => {
		if (roomId === "legacy-chat")
			return { threadId: null, isDelegation: false };
		if (roomId === "broken-chat") throw new Error("unreadable source");
		return { threadId: "source-one", isDelegation: false };
	});
	const { attempt } = setup();
	await expect(attempt.start()).resolves.toEqual({ roomId: "source-chat" });
	mocks.association.mockResolvedValue({
		threadId: null,
		isDelegation: false,
	});
	const again = setup();
	await expect(again.attempt.start()).resolves.toMatchObject({
		roomId: "new-room",
	});
});

it("opens a new chat when the thread is only included elsewhere, and links it", async () => {
	mocks.listRooms.mockResolvedValue([
		{ roomId: "topic-chat", origin: "you" },
	]);
	const { attempt, order } = setup();
	mocks.link.mockImplementation(async () => {
		order.push("link");
	});
	await expect(attempt.start()).resolves.toMatchObject({
		roomId: "new-room",
	});
	expect(order).toEqual([
		"read",
		"initialize",
		"create-bind",
		"upload",
		"source",
		"link",
	]);
	expect(mocks.link).toHaveBeenCalledWith({}, "new-room", "source-one");
});

it("still opens a new chat when the lookup or the link fails", async () => {
	mocks.listRooms.mockRejectedValue(new Error("Reactor not found"));
	mocks.link.mockRejectedValue(new Error("Reactor not found"));
	const { attempt } = setup();
	await expect(attempt.start()).resolves.toMatchObject({
		roomId: "new-room",
	});
	expect(attempt.getSnapshot().error).toBeNull();
});

it("does not look up chats for a source outside Brain", async () => {
	setup();
	const id = "connected:outlook:mail-one";
	const state = sourceImportState();
	const connected = {
		...state,
		threads: state.threads.map((thread) => ({ ...thread, id })),
	};
	const attempt = createSourceImportAttempt(
		"owner-insight",
		id,
		{} as InsightActions,
		() => connected,
	);
	const leave = attempt.retain();
	await attempt.start();
	expect(mocks.listRooms).not.toHaveBeenCalled();
	leave();
});
