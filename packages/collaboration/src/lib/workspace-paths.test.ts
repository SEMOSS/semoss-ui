import { newRoomPath, roomPath, sessionsPath } from "./workspace-paths";

describe("roomPath", () => {
	it("builds direct room URLs with optional focused items", () => {
		expect(roomPath("room/one")).toBe("/room/room%2Fone");
		expect(roomPath("room/one", "item&two")).toBe(
			"/room/room%2Fone?item=item%26two",
		);
	});
});

describe("newRoomPath", () => {
	it("builds bare and agent-scoped new-room URLs", () => {
		expect(newRoomPath()).toBe("/new");
		expect(newRoomPath("agent/one", "model&two")).toBe(
			"/new?agentId=agent%2Fone&model=model%26two",
		);
	});
});

describe("sessionsPath", () => {
	it("builds bare and agent-filtered session URLs", () => {
		expect(sessionsPath()).toBe("/room");
		expect(sessionsPath("agent/one & two")).toBe(
			"/room?agentId=agent%2Fone+%26+two",
		);
	});
});
