import { describe, expect, it } from "vitest";
import { mailThreadFileName, mailThreadToMarkdown } from "./mail.markdown";
import { parseMailPage } from "./mail.parsers";
import {
	getOwnText,
	groupMailByConversation,
	normalizeMailSubject,
	selectThread,
	sortMailOldestFirst,
	stripQuotedHistory,
} from "./mail.threads";
import type { MailMessage } from "./mail.types";
import { MAIL_APPS } from "./mail-apps";

const email = (
	id: string,
	receivedDate: string,
	extra: Partial<MailMessage> = {},
): MailMessage => ({
	id: id,
	to: [],
	cc: [],
	receivedDate: receivedDate,
	isUnread: false,
	hasAttachments: false,
	isBodyTruncated: false,
	attachments: [],
	...extra,
});

describe("normalizeMailSubject", () => {
	it("strips repeated reply and forward prefixes", () => {
		expect(normalizeMailSubject("RE: FW: Re[2]: Budget")).toBe("Budget");
		expect(normalizeMailSubject("AW: WG: Angebot")).toBe("Angebot");
		expect(normalizeMailSubject("Report")).toBe("Report");
		expect(normalizeMailSubject(undefined)).toBe("");
	});

	it("keeps a subject that only starts like a prefix", () => {
		expect(normalizeMailSubject("Recap of the week")).toBe(
			"Recap of the week",
		);
	});
});

describe("groupMailByConversation", () => {
	it("groups a thread under its newest email and keeps the list order", () => {
		const threads = groupMailByConversation([
			email("c", "2026-09-27T12:00:00Z", {
				conversationId: "A",
				isUnread: true,
			}),
			email("b", "2026-09-27T11:00:00Z", { conversationId: "B" }),
			email("a", "2026-09-27T10:00:00Z", {
				conversationId: "A",
				hasAttachments: true,
			}),
			email("solo", "2026-09-27T09:00:00Z"),
		]);

		expect(threads.map((thread) => thread.latest.id)).toEqual([
			"c",
			"b",
			"solo",
		]);
		expect(threads[0]).toMatchObject({
			conversationId: "A",
			isUnread: true,
			hasAttachments: true,
		});
		expect(threads[0].messages.map((message) => message.id)).toEqual([
			"c",
			"a",
		]);
		expect(threads[2].conversationId).toBeUndefined();
	});
});

describe("threads read from every folder", () => {
	it("reads the conversation id from the listing", () => {
		const [message] = parseMailPage({
			messages: [{ id: "u", conversationId: "AAQk=" }],
		}).messages;
		expect(message.conversationId).toBe("AAQk=");
	});

	it("asks each mailbox for the whole thread with its bodies", () => {
		const options = { conversationId: "AAQk=", limit: 50 };
		expect(MAIL_APPS.microsoft.pixels.listConversation(options)).toBe(
			'MicrosoftOutlookListMail(conversationId=["AAQk="], limit=[50], includeBody=[true]);',
		);
		expect(MAIL_APPS.google.pixels.listConversation(options)).toBe(
			'GoogleGmailListMail(conversationId=["AAQk="], limit=[50], includeBody=[true]);',
		);
	});

	it("keeps only the thread's emails, oldest first", () => {
		const thread = selectThread(
			[
				email("new", "2026-09-27T12:00:00Z", { conversationId: "A" }),
				email("other", "2026-09-27T11:00:00Z", { conversationId: "B" }),
				email("old", "2026-09-27T10:00:00Z", { conversationId: "A" }),
			],
			"A",
		);
		expect(thread.map((message) => message.id)).toEqual(["old", "new"]);
	});

	it("sorts by the sent date when there is no received date", () => {
		const sorted = sortMailOldestFirst([
			email("b", "", { receivedDate: undefined, sentDate: "2026-09-02" }),
			email("a", "2026-09-01"),
		]);
		expect(sorted.map((message) => message.id)).toEqual(["a", "b"]);
	});

	it("writes the thread as one document named after its first subject", () => {
		const markdown = mailThreadToMarkdown(MAIL_APPS.microsoft, [
			email("1", "2026-09-27T10:00:00Z", {
				from: "ada@example.com",
				subject: "Budget",
				body: "Here are the numbers.",
			}),
			email("2", "2026-09-27T11:00:00Z", {
				from: "grace@example.com",
				to: ["ada@example.com"],
				subject: "RE: Budget",
				body: "Thanks.",
			}),
		]);
		expect(markdown).toContain("# Budget");
		expect(markdown).toContain("**Emails:** 2");
		expect(markdown).toMatch(
			/## ada@example\.com\n\n\*\*Sent:\*\* Sun, Sep 27, 2026, [^\n]+\n\nHere are the numbers\./,
		);
		expect(markdown).toMatch(
			/## grace@example\.com\n\n\*\*Sent:\*\* [^\n]+ {2}\n\*\*To:\*\* ada@example\.com\n\nThanks\./,
		);
		expect(mailThreadFileName("RE: Budget")).toBe(
			"Email thread - Budget.md",
		);
	});
});

describe("each email on its own", () => {
	it("keeps every email apart when conversations are off", () => {
		const rows = groupMailByConversation(
			[
				email("b", "2026-09-27T11:00:00Z", { conversationId: "A" }),
				email("a", "2026-09-27T10:00:00Z", { conversationId: "A" }),
			],
			false,
		);
		expect(rows).toHaveLength(2);
		expect(rows[0].conversationId).toBeUndefined();
	});

	it("puts a thread under its newest email when a search mixed the order", () => {
		const [thread] = groupMailByConversation([
			email("old", "2026-09-01T10:00:00Z", { conversationId: "A" }),
			email("new", "2026-09-03T10:00:00Z", { conversationId: "A" }),
		]);
		expect(thread.latest.id).toBe("new");
	});

	it("shows an email's own text, from the backend when it reports it", () => {
		expect(
			getOwnText(
				email("u", "2026-09-27", {
					uniqueBody: "Thanks!",
					body: "Thanks!\n\nFrom: Ada\nSent: Monday\nOld text",
				}),
			),
		).toEqual({ text: "Thanks!", isTruncated: false });
	});

	it("says the own text was cut only when the part it shows was", () => {
		// a long body is cut in the history it quotes, after the own text
		expect(
			getOwnText(
				email("a", "2026-09-27", {
					uniqueBody: "Thanks!",
					body: "Thanks!\n\nFrom: Ada\nSent: Monday\nOld text",
					isBodyTruncated: true,
				}),
			),
		).toEqual({ text: "Thanks!", isTruncated: false });
		expect(
			getOwnText(
				email("b", "2026-09-27", {
					body: "Thanks!\n\nFrom: Ada\nSent: Monday\nOld text",
					isBodyTruncated: true,
				}),
			),
		).toEqual({ text: "Thanks!", isTruncated: false });
		expect(
			getOwnText(
				email("c", "2026-09-27", {
					body: "A long email",
					isBodyTruncated: true,
				}),
			),
		).toEqual({ text: "A long email", isTruncated: true });
		expect(
			getOwnText(
				email("d", "2026-09-27", {
					uniqueBody: "A long reply",
					isUniqueBodyTruncated: true,
				}),
			),
		).toEqual({ text: "A long reply", isTruncated: true });
	});

	it("cuts quoted history in the forms mail clients write it", () => {
		expect(
			stripQuotedHistory(
				"Sounds good.\n________________________________\nFrom: Ada\nSent: Monday",
			),
		).toBe("Sounds good.");
		expect(
			stripQuotedHistory(
				"Sounds good.\n\nOn Mon, Sep 27, 2026 at 10:00 AM Ada <ada@example.com> wrote:\n> Hi",
			),
		).toBe("Sounds good.");
		expect(
			stripQuotedHistory(
				"Sounds good. From: Ada Lovelace <ada@example.com> Sent: Monday, September 27 To: Grace Subject: Budget",
			),
		).toBe("Sounds good.");
		expect(stripQuotedHistory("No history here.")).toBe("No history here.");
	});
});
