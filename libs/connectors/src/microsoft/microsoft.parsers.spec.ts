import { describe, expect, it } from "vitest";
import {
	parseCalendarEvents,
	parseChannelMessages,
	parseChatMessages,
	parseChats,
	parseMailList,
	parseMailMessageDetail,
	parseMicrosoftDownload,
	parseOneDriveFolder,
	parseOneDriveResults,
	parseTeams,
	parseTeamsFolder,
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

	it("keeps the backend's ranking for results", () => {
		const items = parseOneDriveResults({
			files: [
				{ id: "b", name: "b.txt", isFolder: false },
				{ id: "a", name: "a", isFolder: true },
			],
		});
		expect(items.map((item) => item.id)).toEqual(["b", "a"]);
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

describe("mail", () => {
	it("reads the list shape the backend returns", () => {
		const [message] = parseMailList({
			folder: "inbox",
			count: 1,
			messages: [
				{
					uid: "AAMk=",
					from: "ada@example.com",
					subject: "Budget",
					receivedDate: "2026-09-27T12:00:00Z",
					unread: true,
					hasAttachments: false,
				},
			],
		});

		expect(message).toMatchObject({
			uid: "AAMk=",
			from: "ada@example.com",
			isUnread: true,
			hasAttachments: false,
			attachments: [],
			isBodyTruncated: false,
		});
	});

	it("says which text was cut, without the mark the backend leaves", () => {
		const [message] = parseMailList({
			messages: [
				{
					uid: "AAMk=",
					body: "Short reply. From: Ada ... [truncated]",
					bodyTruncated: true,
					uniqueBody: "Short reply.",
				},
			],
		});

		expect(message).toMatchObject({
			body: "Short reply. From: Ada",
			isBodyTruncated: true,
			uniqueBody: "Short reply.",
			isUniqueBodyTruncated: false,
		});
	});

	it("reads an opened message with its attachments", () => {
		const message = parseMailMessageDetail({
			uid: "u1",
			body: "Hello",
			bodyTruncated: true,
			hasAttachments: true,
			attachments: [
				{
					id: "a1",
					name: "q3.pdf",
					size: 1024.0,
					isInline: false,
					isFile: true,
				},
				{ name: "missing id" },
			],
		});

		expect(message.body).toBe("Hello");
		expect(message.isBodyTruncated).toBe(true);
		expect(message.attachments).toEqual([
			{
				id: "a1",
				name: "q3.pdf",
				contentType: undefined,
				size: 1024,
				isInline: false,
				isFile: true,
			},
		]);
	});

	it("refuses an opened message without a uid", () => {
		expect(() => parseMailMessageDetail({ subject: "x" })).toThrow();
	});
});

describe("calendar", () => {
	it("reads the flat start and end the backend returns", () => {
		const [event] = parseCalendarEvents({
			start: "s",
			end: "e",
			count: 1,
			events: [
				{
					id: "e1",
					subject: "Sync",
					start: "2026-09-27T13:00:00.0000000",
					startTimeZone: "UTC",
					isAllDay: false,
					attendees: [{ name: "Ada" }, {}],
					isOnlineMeeting: true,
					joinUrl: "https://teams.example/join",
				},
			],
		});

		expect(event).toMatchObject({
			id: "e1",
			startTimeZone: "UTC",
			isOnlineMeeting: true,
			isCancelled: false,
		});
		expect(event.attendees).toHaveLength(1);
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

	it("puts a chat's messages oldest first", () => {
		const { messages } = parseChatMessages({
			messages: [
				{ id: "b", createdDateTime: "2026-09-02T00:00:00Z", body: "b" },
				{ id: "a", createdDateTime: "2026-09-01T00:00:00Z", body: "a" },
			],
		});
		expect(messages.map((message) => message.id)).toEqual(["a", "b"]);
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
