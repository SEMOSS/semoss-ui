import {
	isHeroPath,
	newRoomPath,
	roomPath,
	threadPath,
	topicPath,
	twinChatPath,
	twinContentsPath,
} from "./workspace-paths";

it("encodes a topic identity as one shared workspace route segment", () => {
	expect(topicPath("client/one?#")).toBe("/topics/client%2Fone%3F%23");
});

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

it("names the twin to chat with, and the place its contents page opens on, in the address", () => {
	expect(twinChatPath("agent/one")).toBe("/twins/chat?agentId=agent%2Fone");
	expect(twinContentsPath()).toBe("/twins/mine/contents");
	expect(twinContentsPath("teams-chats")).toBe(
		"/twins/mine/contents?in=teams-chats",
	);
});

it("opens Today, Work, its review and its topics on the hero photo, with or without a trailing slash", () => {
	for (const path of ["/", "/work", "/work/", "/work/review", "/work/topics"])
		expect(isHeroPath(path)).toBe(true);
	// Settings lists the same topics under its own tab bar, without the hero
	for (const path of [
		"/brain/topics",
		"/work/item/one",
		"/routines",
		"/brain",
	])
		expect(isHeroPath(path)).toBe(false);
});
