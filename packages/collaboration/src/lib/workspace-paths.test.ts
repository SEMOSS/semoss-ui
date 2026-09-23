import { newRoomPath } from "./workspace-paths";

describe("newRoomPath", () => {
	it("builds bare and agent-scoped new-room URLs", () => {
		expect(newRoomPath()).toBe("/new");
		expect(newRoomPath("agent/one", "model&two")).toBe(
			"/new?agentId=agent%2Fone&model=model%26two",
		);
	});
});
