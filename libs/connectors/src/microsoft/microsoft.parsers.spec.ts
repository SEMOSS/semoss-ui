import { describe, expect, it } from "vitest";
import {
	parseChannelMessages,
	parseChatDetail,
	parseChatMessages,
	parseChats,
	parseMicrosoftDownload,
	parseOneDriveFolder,
	parseTeams,
	parseTeamsFolder,
	parseTeamsMessageSearch,
} from "./microsoft.parsers";

describe("OneDrive listings", () => {
	it("reads files, sorting folders first and names as numbers", () => {
		const items = parseOneDriveFolder({
			count: 4,
			files: [
				{ id: "3", name: "file10.txt", isFolder: false, size: 10 },
				{ id: "1", name: "Reports", isFolder: true, childCount: 2 },
				{ id: "2", name: "file2.txt", isFolder: false },
				{ name: "no id", isFolder: false },
			],
		});

		expect(items.map((item) => item.name)).toEqual([
			"Reports",
			"file2.txt",
			"file10.txt",
		]);
		expect(items[0]).toMatchObject({ isFolder: true, childCount: 2 });
		expect(items[2].size).toBe(10);
	});

	it("reads a Teams channel folder, which is a bare list", () => {
		const items = parseTeamsFolder([
			{ id: "f", name: "Deck.pptx", driveId: "d1", isFolder: false },
		]);
		expect(items[0]).toMatchObject({ driveId: "d1", name: "Deck.pptx" });
	});

	it("refuses a response without files", () => {
		expect(() => parseOneDriveFolder({ count: 0 })).toThrow();
		expect(() => parseOneDriveFolder("oops")).toThrow();
	});
});

describe("downloads", () => {
	it("reads where the file was saved", () => {
		expect(
			parseMicrosoftDownload({ filePath: "q3.xlsx", name: "Q3.xlsx" }),
		).toEqual({ filePath: "q3.xlsx", name: "Q3.xlsx" });
	});

	it("refuses a response without a path", () => {
		expect(() => parseMicrosoftDownload({ success: true })).toThrow();
	});
});

describe("Teams", () => {
	it("sorts teams by name", () => {
		const teams = parseTeams([
			{ id: "2", displayName: "beta" },
			{ id: "1", displayName: "Alpha" },
		]);
		expect(teams.map((team) => team.displayName)).toEqual([
			"Alpha",
			"beta",
		]);
	});

	it("keeps people's threads newest first, with replies oldest first", () => {
		const { messages: threads, readCount } = parseChannelMessages({
			messages: [
				{
					id: "old",
					createdDateTime: "2026-09-01T10:00:00Z",
					body: "first",
				},
				{
					id: "system",
					messageType: "systemEventMessage",
					createdDateTime: "2026-09-02T10:00:00Z",
				},
				{
					id: "new",
					createdDateTime: "2026-09-03T10:00:00Z",
					body: "second",
					replies: [
						{ id: "r2", createdDateTime: "2026-09-03T12:00:00Z" },
						{ id: "r1", createdDateTime: "2026-09-03T11:00:00Z" },
					],
				},
			],
		});

		expect(threads.map((thread) => thread.id)).toEqual(["new", "old"]);
		expect(readCount).toBe(3);
		expect(threads[0].replies.map((reply) => reply.id)).toEqual([
			"r1",
			"r2",
		]);
	});

	it("puts a chat's messages newest first", () => {
		const { messages } = parseChatMessages({
			messages: [
				{ id: "a", createdDateTime: "2026-09-01T00:00:00Z", body: "a" },
				{ id: "c", createdDateTime: "2026-09-03T00:00:00Z", body: "c" },
				{ id: "b", createdDateTime: "2026-09-02T00:00:00Z", body: "b" },
			],
		});
		expect(messages.map((message) => message.id)).toEqual(["c", "b", "a"]);
	});

	it("orders chats by their newest message rather than their last edit", () => {
		const chats = parseChats({
			chats: [
				{
					id: "renamed",
					lastUpdatedDateTime: "2026-09-05T00:00:00Z",
					lastMessage: {
						id: "m1",
						createdDateTime: "2026-09-01T00:00:00Z",
					},
				},
				{
					id: "busy",
					lastUpdatedDateTime: "2026-08-01T00:00:00Z",
					lastMessage: {
						id: "m2",
						createdDateTime: "2026-09-04T00:00:00Z",
					},
				},
			],
		});
		expect(chats.map((chat) => chat.id)).toEqual(["busy", "renamed"]);
	});

	it("says who a one on one chat is with, by the id or the address the listing gave", () => {
		const [named, read, group, unknown] = parseChats({
			chats: [
				// named from its last message: the other person alone, by their id
				{
					id: "d",
					chatType: "oneOnOne",
					displayName: "Dana Ortiz",
					members: [{ userId: "id-dana", name: "Dana Ortiz" }],
					lastMessage: { id: "m4", createdDateTime: "2026-09-04" },
				},
				// named from its members, which hold the signed in user too
				{
					id: "c",
					chatType: "oneOnOne",
					displayName: "Ben Carter",
					members: [
						{
							userId: "id-me",
							name: "Robin Hale",
							email: "me@x.io",
						},
						{ name: "Ben Carter", email: "ben@x.io" },
					],
					lastMessage: { id: "m3", createdDateTime: "2026-09-03" },
				},
				// a group is nobody's, whoever it is named after
				{
					id: "b",
					chatType: "group",
					displayName: "Dana Ortiz",
					members: [{ userId: "id-dana", name: "Dana Ortiz" }],
					lastMessage: { id: "m2", createdDateTime: "2026-09-02" },
				},
				// nobody named, and members that are not what a listing gives
				{
					id: "a",
					chatType: "oneOnOne",
					displayName: "Kira Stone",
					members: ["Kira Stone", { name: "Kira Stone" }],
					lastMessage: { id: "m1", createdDateTime: "2026-09-01" },
				},
			],
		});
		expect(named.person).toEqual({ userId: "id-dana", email: undefined });
		expect(read.person).toEqual({ userId: undefined, email: "ben@x.io" });
		expect(group.person).toBeUndefined();
		expect(unknown.person).toBeUndefined();
	});

	it("reads one chat", () => {
		expect(
			parseChatDetail({ id: "19:abc", topic: "Launch", webUrl: "u" }),
		).toMatchObject({ id: "19:abc", displayName: "Launch", webUrl: "u" });
		expect(() => parseChatDetail({ topic: "no id" })).toThrow();
	});

	it("lists chats by recent activity and names them by topic", () => {
		const chats = parseChats({
			chats: [
				{
					id: "1",
					topic: "Launch",
					lastUpdatedDateTime: "2026-09-01T00:00:00Z",
				},
				{
					id: "2",
					displayName: "Ada, Grace",
					lastUpdatedDateTime: "2026-09-02T00:00:00Z",
					hasUnread: true,
					lastMessage: { id: "m", body: "hi", fromName: "Ada" },
				},
			],
		});

		expect(chats.map((chat) => chat.id)).toEqual(["2", "1"]);
		expect(chats[1].displayName).toBe("Launch");
		expect(chats[0].lastMessage?.fromName).toBe("Ada");
		expect(chats[0].hasUnread).toBe(true);
	});
});

describe("Teams message search", () => {
	it("reads hits newest first and drops ones that cannot be opened", () => {
		const page = parseTeamsMessageSearch({
			search: "budget",
			hasMore: true,
			nextOffset: 25,
			messages: [
				{
					id: "old",
					kind: "chat",
					chatId: "19:a",
					createdDateTime: "2026-09-01T00:00:00Z",
					summary: "the budget",
					fromName: "Ada",
				},
				{
					id: "post",
					kind: "channel",
					teamId: "t",
					channelId: "c",
					createdDateTime: "2026-09-03T00:00:00Z",
				},
				{ id: "lost", kind: "chat" },
				{ id: "half", kind: "channel", teamId: "t" },
				{ kind: "chat", chatId: "19:b" },
			],
		});

		expect(page.hits.map((hit) => hit.id)).toEqual(["post", "old"]);
		expect(page.hits[1]).toMatchObject({
			kind: "chat",
			chatId: "19:a",
			summary: "the budget",
			fromName: "Ada",
		});
		expect(page.hits[0].summary).toBe("");
		expect(page.hasMore).toBe(true);
		expect(page.nextOffset).toBe(25);
	});

	it("reads a missing or malformed next offset as unknown", () => {
		for (const nextOffset of [undefined, -1, 2.5, "25"]) {
			expect(
				parseTeamsMessageSearch({
					messages: [],
					nextOffset: nextOffset,
				}).nextOffset,
			).toBeUndefined();
		}
	});

	it("refuses a response without messages", () => {
		expect(() => parseTeamsMessageSearch({ count: 0 })).toThrow();
	});
});

it("omits unset and invalid Teams chat timestamps", () => {
	const chats = parseChats({
		chats: [
			{ id: "missing", lastUpdatedDateTime: "0001-01-01T00:00:00Z" },
			{ id: "invalid", lastUpdatedDateTime: "not a date" },
			{ id: "valid", lastUpdatedDateTime: "2026-06-15T12:00:00Z" },
		],
	});
	expect(
		chats.find((chat) => chat.id === "missing")?.lastUpdatedDateTime,
	).toBeUndefined();
	expect(
		chats.find((chat) => chat.id === "invalid")?.lastUpdatedDateTime,
	).toBeUndefined();
	expect(chats[0].id).toBe("valid");
});
