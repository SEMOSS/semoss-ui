import { act, renderHook, waitFor } from "@testing-library/react";
import type { RoomRow } from "./room-schemas";
import { useRooms } from "./use-rooms";

const listRooms = vi.hoisted(() => vi.fn());
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => insight,
}));

vi.mock("./list-rooms", () => ({ listRooms }));

interface Deferred<T> {
	promise: Promise<T>;
	resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((accept) => {
		resolve = accept;
	});
	return { promise, resolve };
}

describe("useRooms", () => {
	beforeEach(() => listRooms.mockReset());

	it("keeps rooms from every workspace together with unassigned rooms", async () => {
		const first = deferred<RoomRow[]>();
		listRooms.mockReturnValueOnce(first.promise).mockResolvedValueOnce([
			{
				roomId: "pending-room",
				roomName: "New research",
				modelId: "model-2",
				workspaceId: "workspace-1",
				dateUpdated: "2026-09-22T12:00:00Z",
			},
		]);
		const { result, rerender } = renderHook(
			({ versions }) =>
				useRooms(["workspace-1", "workspace-2"], versions),
			{ initialProps: { versions: {} as Record<string, number> } },
		);

		act(() => {
			result.current.addPendingRoom({
				id: "pending-room",
				agentId: "workspace-1",
				modelId: "model-1",
				title: "New research",
				origin: "You",
				status: "Ready",
				updatedAt: "2026-09-22T11:00:00Z",
				unread: false,
				pinned: false,
				preview: "",
			});
		});
		expect(result.current.sessions.map((session) => session.id)).toEqual([
			"pending-room",
		]);

		first.resolve([
			{
				roomId: "foreign-room",
				workspaceId: "workspace-3",
				dateUpdated: "2026-09-22T09:00:00Z",
			},
			{
				roomId: "unassigned-room",
				roomName: "Personal notes",
				dateUpdated: "2026-09-22T10:00:00Z",
			},
		]);
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(listRooms).toHaveBeenCalledOnce();
		expect(result.current.sessions.map((session) => session.id)).toEqual([
			"pending-room",
			"unassigned-room",
			"foreign-room",
		]);

		rerender({ versions: { "workspace-1": 1 } });
		await waitFor(() => expect(listRooms).toHaveBeenCalledTimes(2));
		await waitFor(() =>
			expect(result.current.sessions).toEqual([
				expect.objectContaining({
					id: "pending-room",
					agentId: "workspace-1",
					modelId: "model-2",
					title: "New research",
					updatedAt: "2026-09-22T12:00:00Z",
				}),
			]),
		);
	});

	it("loads assigned and unassigned rooms when there are no agents", async () => {
		listRooms.mockResolvedValue([
			{
				roomId: "unassigned-room",
				roomName: "Personal notes",
				dateUpdated: "2026-09-22T10:00:00Z",
			},
			{
				roomId: "assigned-room",
				workspaceId: "workspace-1",
				dateUpdated: "2026-09-22T09:00:00Z",
			},
		]);

		const { result } = renderHook(() => useRooms([]));

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.sessions).toEqual([
			expect.objectContaining({
				id: "unassigned-room",
				agentId: "",
				title: "Personal notes",
			}),
			expect.objectContaining({
				id: "assigned-room",
				agentId: "workspace-1",
			}),
		]);
	});

	it("updates and removes pending rooms without letting them reappear", async () => {
		const first = deferred<RoomRow[]>();
		listRooms.mockReturnValueOnce(first.promise).mockResolvedValueOnce([]);
		const { result, rerender } = renderHook(
			({ version }) =>
				useRooms(["workspace-1"], { "workspace-1": version }),
			{ initialProps: { version: 0 } },
		);

		act(() => {
			result.current.addPendingRoom({
				id: "pending-room",
				agentId: "workspace-1",
				title: "Draft room",
				origin: "You",
				status: "Ready",
				updatedAt: "2026-09-22T11:00:00Z",
				unread: false,
				pinned: false,
				preview: "",
			});
			result.current.updateRoom("pending-room", {
				title: "Renamed room",
			});
		});
		expect(result.current.sessions[0]?.title).toBe("Renamed room");

		first.resolve([]);
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.sessions[0]?.title).toBe("Renamed room");

		act(() => result.current.removeRoom("pending-room"));
		expect(result.current.sessions).toEqual([]);

		rerender({ version: 1 });
		await waitFor(() => expect(listRooms).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.sessions).toEqual([]);
	});
});
