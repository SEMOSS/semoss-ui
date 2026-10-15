import { renderHook } from "@testing-library/react";
import type { ConnectorSavedFile } from "@semoss/connectors";
import { FILE_PANEL_EVENTS, getFilePanelScope } from "@semoss/panels";
import { createWorkbenchStore } from "@semoss/workbench";
import { RoomSession } from "../rooms/room-session";
import { useRoomConnectorHost } from "./use-room-connector-host";

const mocks = vi.hoisted(() => ({
	readConnectors: vi.fn(),
	readWorkbench: vi.fn(),
	connectMicrosoft: vi.fn(),
	success: vi.fn(),
	error: vi.fn(),
	translate: (key: string) => key,
}));

vi.mock("./room-connectors.context", () => ({
	useRoomConnectors: mocks.readConnectors,
}));
vi.mock("../tools/tool-workbench.context", () => ({
	useToolWorkbench: mocks.readWorkbench,
}));
vi.mock("../connectors/api/microsoft", () => ({
	connectMicrosoft: mocks.connectMicrosoft,
}));
vi.mock("@semoss/i18n", async (original) => ({
	...(await original<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: mocks.translate }),
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	toast: { success: mocks.success, error: mocks.error },
}));

const sessions: RoomSession[] = [];
const saved: ConnectorSavedFile = {
	path: "Project-review.md",
	name: "Project review.md",
	service: "outlook-mail",
};

function deferred<Value>() {
	let resolve: (value: Value) => void = () => undefined;
	let reject: (reason: Error) => void = () => undefined;
	const promise = new Promise<Value>((done, fail) => {
		resolve = done;
		reject = fail;
	});
	return { promise, resolve, reject };
}

function createOwner(insightId: string) {
	const session = new RoomSession("test-account");
	sessions.push(session);
	vi.spyOn(session.insight, "insightId", "get").mockReturnValue(insightId);
	const create = vi.spyOn(session, "create").mockResolvedValue("saved-room");
	const store = createWorkbenchStore({ components: {} });
	const emit = vi.spyOn(store.getState().events.actions, "emit");
	const select = () => {
		mocks.readConnectors.mockReturnValue({ session });
		// The session's insight must win over an earlier workbench snapshot.
		mocks.readWorkbench.mockReturnValue({
			store,
			insightId: "old-workbench-id",
		});
	};
	return { session, create, store, emit, select };
}

beforeEach(() => {
	vi.clearAllMocks();
});
afterEach(() => {
	for (const session of sessions.splice(0)) session.dispose();
	vi.restoreAllMocks();
});

it("retains the origin before preparing its file space and returns its release", async () => {
	const origin = createOwner("origin-insight");
	origin.select();
	const order: string[] = [];
	const release = vi.fn();
	vi.spyOn(origin.session, "retain").mockImplementation(() => {
		order.push("retain");
		return release;
	});
	const pending = deferred<string>();
	origin.create.mockImplementation(() => {
		order.push("create");
		return pending.promise;
	});
	const { result } = renderHook(() => useRoomConnectorHost());
	const preparation = result.current.prepareSave?.();
	expect(order).toEqual(["retain", "create"]);
	expect(origin.create).toHaveBeenCalledExactlyOnceWith("New chat");
	expect(release).not.toHaveBeenCalled();
	pending.resolve("saved-room");
	const releaseSave = await preparation;
	expect(releaseSave).toBe(release);
	expect(release).not.toHaveBeenCalled();
	if (typeof releaseSave !== "function")
		throw new Error("Missing save release");
	releaseSave();
	expect(release).toHaveBeenCalledOnce();
});

it("releases exactly once when file-space preparation fails", async () => {
	const origin = createOwner("origin-insight");
	origin.select();
	const release = vi.fn();
	vi.spyOn(origin.session, "retain").mockReturnValue(release);
	const failure = new Error("Could not prepare chat files");
	origin.create.mockRejectedValue(failure);
	const { result } = renderHook(() => useRoomConnectorHost());
	await expect(result.current.prepareSave?.()).rejects.toBe(failure);
	expect(release).toHaveBeenCalledOnce();
	expect(origin.emit).not.toHaveBeenCalled();
	expect(origin.session.getSnapshot().contextFiles).toEqual([]);
});

it("refreshes the originating insight's Files panel after Save", () => {
	const origin = createOwner("origin-insight");
	origin.select();
	const { result } = renderHook(() => useRoomConnectorHost());
	result.current.onSaved?.(saved);
	expect(origin.emit).toHaveBeenCalledExactlyOnceWith(
		FILE_PANEL_EVENTS.FILES_CHANGED,
		{
			scope: getFilePanelScope({
				type: "INSIGHT",
				insightId: "origin-insight",
			}),
			paths: [saved.path],
		},
	);
	expect(origin.session.getSnapshot().contextFiles).toEqual([]);
	expect(mocks.success).toHaveBeenCalledOnce();
});

it("queues saved files through the session's deduplicating method", () => {
	const origin = createOwner("origin-insight");
	origin.select();
	const add = vi.spyOn(origin.session, "addContextFile");
	const { result } = renderHook(() => useRoomConnectorHost());
	result.current.onAddToContext?.(saved);
	result.current.onAddToContext?.({ ...saved });
	expect(add).toHaveBeenCalledTimes(2);
	expect(add).toHaveBeenLastCalledWith({
		fileLocation: saved.path,
		fileName: saved.name,
	});
	expect(origin.session.getSnapshot().contextFiles).toEqual([
		{ fileLocation: saved.path, fileName: saved.name },
	]);
	expect(origin.emit).toHaveBeenCalledTimes(2);
});

it("keeps pending preparation and late callbacks bound to the original session after navigation", async () => {
	const origin = createOwner("origin-insight");
	const destination = createOwner("destination-insight");
	origin.select();
	const release = vi.fn();
	vi.spyOn(origin.session, "retain").mockReturnValue(release);
	const pending = deferred<string>();
	origin.create.mockReturnValue(pending.promise);
	const { result, rerender, unmount } = renderHook(() =>
		useRoomConnectorHost(),
	);
	const originHost = result.current;
	const preparation = originHost.prepareSave?.();
	destination.select();
	rerender();
	expect(result.current.onAddToContext).not.toBe(originHost.onAddToContext);
	unmount();
	pending.resolve("origin-room");
	const releaseSave = await preparation;
	originHost.onSaved?.(saved);
	originHost.onAddToContext?.(saved);
	expect(origin.emit).toHaveBeenCalledTimes(2);
	expect(origin.emit).toHaveBeenLastCalledWith(
		FILE_PANEL_EVENTS.FILES_CHANGED,
		{
			scope: getFilePanelScope({
				type: "INSIGHT",
				insightId: "origin-insight",
			}),
			paths: [saved.path],
		},
	);
	expect(origin.session.getSnapshot().contextFiles).toEqual([
		{ fileLocation: saved.path, fileName: saved.name },
	]);
	expect(destination.emit).not.toHaveBeenCalled();
	expect(destination.create).not.toHaveBeenCalled();
	expect(destination.session.getSnapshot().contextFiles).toEqual([]);
	expect(release).not.toHaveBeenCalled();
	if (typeof releaseSave !== "function")
		throw new Error("Missing save release");
	releaseSave();
	expect(release).toHaveBeenCalledOnce();
});

it("omits session-only actions and uses the workbench scope when no room session is available", () => {
	const origin = createOwner("unused-insight");
	mocks.readConnectors.mockReturnValue({});
	mocks.readWorkbench.mockReturnValue({
		store: origin.store,
		insightId: "workbench-insight",
	});
	const { result } = renderHook(() => useRoomConnectorHost());
	expect(result.current.prepareSave).toBeUndefined();
	expect(result.current.onAddToContext).toBeUndefined();
	result.current.onSaved?.(saved);
	expect(origin.emit).toHaveBeenCalledExactlyOnceWith(
		FILE_PANEL_EVENTS.FILES_CHANGED,
		{
			scope: getFilePanelScope({
				type: "INSIGHT",
				insightId: "workbench-insight",
			}),
			paths: [saved.path],
		},
	);
});

it("starts sign-in synchronously and reports a rejected attempt", async () => {
	const origin = createOwner("origin-insight");
	origin.select();
	const pending = deferred<void>();
	mocks.connectMicrosoft.mockReturnValue(pending.promise);
	const { result } = renderHook(() => useRoomConnectorHost());
	const signingIn = result.current.onSignIn?.();
	expect(mocks.connectMicrosoft).toHaveBeenCalledOnce();
	pending.reject(new Error("Popup blocked"));
	await expect(signingIn).resolves.toBe(false);
	expect(mocks.error).toHaveBeenCalledOnce();
});
