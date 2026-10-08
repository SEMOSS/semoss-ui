import {
	newRoomPath,
	roomPath,
	sessionsPath,
	threadPath,
} from "./workspace-paths";

it("encodes a conversation identity as one canonical route segment", () => {
	expect(threadPath("connected:email/one?#")).toBe(
		"/thread/connected%3Aemail%2Fone%3F%23",
	);
});

describe("roomPath", () => {
	it("builds direct room URLs with optional focused items", () => {
		expect(roomPath("room/one")).toBe("/thread/room%3Aroom%2Fone");
		expect(roomPath("room/one", "item&two")).toBe(
			"/thread/room%3Aroom%2Fone?item=item%26two",
		);
	});
});

describe("newRoomPath", () => {
	it("builds bare and agent-scoped new-room URLs", () => {
		expect(newRoomPath()).toBe("/");
		expect(newRoomPath("agent/one", "model&two")).toBe(
			"/?agentId=agent%2Fone&model=model%26two",
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
