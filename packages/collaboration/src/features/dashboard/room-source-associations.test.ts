import { expect, it, vi } from "vitest";
import { readRoomSourceAssociation } from "@/features/rooms/api/read-room-source-association";
import { createRoomSourceAssociations } from "./room-source-associations";

vi.mock("@/features/rooms/api/read-room-source-association", () => ({
	readRoomSourceAssociation: vi.fn(),
}));

it("shares settled results and retryable errors between overlapping active readers", async () => {
	const read = vi.mocked(readRoomSourceAssociation);
	read.mockResolvedValue("thread");
	const cache = createRoomSourceAssociations(() => ({}) as never);
	const first = cache.createActivation();
	const second = cache.createActivation();
	const releaseFirst = first.retain();
	const releaseSecond = second.retain();
	first.inspect(["room"]);
	await vi.waitFor(() => expect(first.get("room")?.status).toBe("ready"));
	read.mockRejectedValue(new Error("Offline"));
	second.inspect(["room"]);
	await vi.waitFor(() => expect(second.get("room")?.status).toBe("error"));
	expect(first.get("room")).toMatchObject({
		status: "error",
		threadId: "thread",
	});
	read.mockResolvedValue("updated-thread");
	first.inspect(["room"], true);
	await vi.waitFor(() =>
		expect(second.get("room")).toEqual({
			status: "ready",
			threadId: "updated-thread",
		}),
	);
	expect(first.get("room")).toEqual(second.get("room"));
	releaseFirst();
	releaseSecond();
});
