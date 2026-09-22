import { draftRoomPath } from "./workspace-paths";

describe("draftRoomPath", () => {
	it("keeps the client draft and selected model in the URL", () => {
		expect(draftRoomPath("agent/one", "draft one", "model&two")).toBe(
			"/agents/agent%2Fone/new/draft%20one?model=model%26two",
		);
	});
});
