import { describe, expect, it } from "vitest";
import {
	parseMailFolders,
	parseMailMessageDetail,
	parseMailPage,
	readMailSavedPath,
} from "./mail.parsers";

describe("mail", () => {
	it("reads the page shape every mailbox returns", () => {
		const page = parseMailPage({
			folder: "inbox",
			offset: 0,
			count: 1,
			hasMore: true,
			messages: [
				{
					id: "AAMk=",
					from: "ada@example.com",
					to: ["me@example.com", "bob@example.com"],
					subject: "Budget",
					receivedDate: "2026-09-27T12:00:00Z",
					unread: true,
					hasAttachments: false,
				},
			],
		});

		expect(page.hasMore).toBe(true);
		expect(page.messages[0]).toMatchObject({
			id: "AAMk=",
			from: "ada@example.com",
			to: ["me@example.com", "bob@example.com"],
			cc: [],
			isUnread: true,
			hasAttachments: false,
			attachments: [],
			isBodyTruncated: false,
		});
	});

	it("says which text was cut, without the mark the backend leaves", () => {
		const [message] = parseMailPage({
			messages: [
				{
					id: "AAMk=",
					body: "Short reply. From: Ada ... [truncated]",
					bodyTruncated: true,
					uniqueBody: "Short reply.",
				},
			],
		}).messages;

		expect(message).toMatchObject({
			body: "Short reply. From: Ada",
			isBodyTruncated: true,
			uniqueBody: "Short reply.",
			isUniqueBodyTruncated: false,
		});
	});

	it("reads an opened message with its attachments", () => {
		const message = parseMailMessageDetail({
			id: "u1",
			body: "Hello",
			bodyTruncated: true,
			hasAttachments: true,
			webLink: "https://mail.google.com/mail/#all/t1",
			attachments: [
				{
					id: "a1",
					name: "q3.pdf",
					size: 1024.0,
					isInline: false,
					kind: "file",
				},
				{ name: "missing id" },
			],
		});

		expect(message.body).toBe("Hello");
		expect(message.isBodyTruncated).toBe(true);
		expect(message.webLink).toBe("https://mail.google.com/mail/#all/t1");
		expect(message.attachments).toEqual([
			{
				id: "a1",
				name: "q3.pdf",
				contentType: undefined,
				size: 1024,
				isInline: false,
				kind: "file",
			},
		]);
	});

	it("refuses an opened message without an id", () => {
		expect(() => parseMailMessageDetail({ subject: "x" })).toThrow();
	});

	it("reads folders and labels the same way", () => {
		expect(
			parseMailFolders({
				folders: [
					{
						id: "INBOX",
						name: "Inbox",
						kind: "system",
						unreadCount: 2,
					},
					{ id: "Label_1", name: "Clients", kind: "label" },
					{ name: "missing id" },
				],
			}),
		).toEqual([
			{
				id: "INBOX",
				name: "Inbox",
				kind: "system",
				totalCount: undefined,
				unreadCount: 2,
			},
			{
				id: "Label_1",
				name: "Clients",
				kind: "label",
				totalCount: undefined,
				unreadCount: undefined,
			},
		]);
	});

	it("reads where an attachment was saved", () => {
		expect(readMailSavedPath({ filePath: "q3.pdf", success: true })).toBe(
			"q3.pdf",
		);
		expect(() => readMailSavedPath({ success: true })).toThrow();
	});
});
