import { expect, test } from "vitest";
import { DEFAULT_CHAT_OPTIONS, resolveChatOptions } from "./chat-options";

const roomHref = (roomId: string) => `#/room/${roomId}`;

test("a host's options fill in from the chat's defaults", () => {
	const options = resolveChatOptions({ roomHref, isTableExportable: true });
	expect(options).toMatchObject({
		...DEFAULT_CHAT_OPTIONS,
		roomHref,
		isTableExportable: true,
	});
});

test("an option set to undefined counts as left out", () => {
	const options = resolveChatOptions({
		roomHref,
		compactionStrategy: undefined,
		isModelSelectable: undefined,
	});
	expect(options.compactionStrategy).toBe("AUTO");
	expect(options.isModelSelectable).toBe(true);
});

test("the same host options resolve to the same object", () => {
	const host = { roomHref, appName: "Chat" };
	expect(resolveChatOptions(host)).toBe(resolveChatOptions(host));
	expect(resolveChatOptions({ ...host })).not.toBe(resolveChatOptions(host));
});

test("by default every room and message action is kept", () => {
	const options = resolveChatOptions({ roomHref });
	expect(options.roomActions(["favorite", "delete"])).toEqual([
		"favorite",
		"delete",
	]);
	expect(options.messageActions(["rewrite"])).toEqual(["rewrite"]);
});
