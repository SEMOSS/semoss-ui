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
		expect(page.rawCount).toBe(1);
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

	it("retains the raw count before malformed messages are dropped", () => {
		expect(
			parseMailPage({
				count: 3,
				hasMore: true,
				messages: [{ id: "ok" }, {}, null],
			}),
		).toMatchObject({ rawCount: 3, messages: [{ id: "ok" }] });
		expect(parseMailPage({ messages: [{ id: "ok" }, {}] }).rawCount).toBe(
			2,
		);
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
					{
						id: "Label_2",
						name: "Acme",
						kind: "label",
						parentId: "Label_1",
						path: "Clients/Acme",
						depth: 1,
					},
					{ name: "missing id" },
				],
			}),
		).toEqual([
			{
				id: "INBOX",
				name: "Inbox",
				kind: "system",
				parentId: undefined,
				path: undefined,
				depth: 0,
				totalCount: undefined,
				unreadCount: 2,
			},
			{
				id: "Label_1",
				name: "Clients",
				kind: "label",
				parentId: undefined,
				path: undefined,
				depth: 0,
				totalCount: undefined,
				unreadCount: undefined,
			},
			{
				id: "Label_2",
				name: "Acme",
				kind: "label",
				parentId: "Label_1",
				path: "Clients/Acme",
				depth: 1,
				totalCount: undefined,
				unreadCount: undefined,
			},
		]);
	});

	it("reads the formatted body only when it is well formed", () => {
		expect(
			parseMailMessageDetail({
				id: "m1",
				displayBody: {
					contentType: "html",
					content: "<p>Hi</p>",
					isTruncated: false,
				},
			}).displayBody,
		).toEqual({
			contentType: "html",
			content: "<p>Hi</p>",
			isTruncated: false,
			inlineImagesOmitted: 0,
		});
		for (const displayBody of [
			{ contentType: "rtf", content: "x" },
			{ contentType: "html", content: "  " },
			{ contentType: "html" },
			"<p>Hi</p>",
		]) {
			expect(
				parseMailMessageDetail({ id: "m1", displayBody: displayBody })
					.displayBody,
			).toBeUndefined();
		}
	});

	it("reads only well formed embedded pictures, and how many were left out", () => {
		const displayBody = parseMailMessageDetail({
			id: "m1",
			displayBody: {
				contentType: "html",
				content: '<img src="cid:logo">',
				inlineImages: [
					{
						contentId: "logo",
						contentType: "image/png",
						data: "iVBORw==",
					},
					{
						contentId: "sig",
						contentType: "text/html",
						data: "PGI+",
					},
					{
						contentId: "bad",
						contentType: "image/png",
						data: "not base64!",
					},
					{ contentType: "image/png", data: "iVBORw==" },
				],
				inlineImagesOmitted: 2,
			},
		}).displayBody;
		expect(displayBody?.inlineImages).toEqual([
			{ contentId: "logo", contentType: "image/png", data: "iVBORw==" },
		]);
		expect(displayBody?.inlineImagesOmitted).toBe(2);
		expect(
			parseMailMessageDetail({
				id: "m1",
				displayBody: { contentType: "html", content: "<p>Hi</p>" },
			}).displayBody?.inlineImages,
		).toBeUndefined();
	});

	it("checks a picture of millions of letters without overflowing", () => {
		const large = `${"A".repeat(4_500_000)}AA==`;
		const read = (data: string) =>
			parseMailMessageDetail({
				id: "m1",
				displayBody: {
					contentType: "html",
					content: '<img src="cid:big">',
					inlineImages: [
						{
							contentId: "big",
							contentType: "image/png",
							data: data,
						},
					],
				},
			}).displayBody?.inlineImages;
		expect(read(large)).toHaveLength(1);
		expect(read(`${"A".repeat(4_500_001)}`)).toEqual([]);
		expect(read("AA=A")).toEqual([]);
		expect(read("AAA===")).toEqual([]);
	});

	it("reads the name the mailbox knows a folder by, in lower case", () => {
		const [inbox, other] = parseMailFolders({
			folders: [
				{ id: "AAMk1", name: "Posteingang", wellKnownName: "Inbox" },
				{ id: "AAMk2", name: "Projekte", wellKnownName: "  " },
			],
		});
		expect(inbox.wellKnownName).toBe("inbox");
		expect(other.wellKnownName).toBeUndefined();
	});

	it("reads a malformed folder depth as the top of the mailbox", () => {
		expect(
			parseMailFolders({
				folders: [
					{ id: "a", name: "A", depth: -1 },
					{ id: "b", name: "B", depth: 1.5 },
					{ id: "c", name: "C", depth: "2" },
				],
			}).map((folder) => folder.depth),
		).toEqual([0, 0, 0]);
	});

	it("reads where an attachment was saved", () => {
		expect(readMailSavedPath({ filePath: "q3.pdf", success: true })).toBe(
			"q3.pdf",
		);
		expect(() => readMailSavedPath({ success: true })).toThrow();
	});
});
