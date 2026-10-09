import { describe, expect, it } from "vitest";
import {
	mailMessageFileName,
	mailMessageToMarkdown,
	mailThreadToMarkdown,
} from "./mail.markdown";
import type { MailMessage } from "./mail.types";
import { MAIL_APPS } from "./mail-apps";

/*
 * Times are written in the zone of whoever runs the tests, so they are set at
 * midday UTC, which is the same day in almost every zone, and only the day is
 * compared exactly.
 */

/** A time of day and its zone, such as `8:00 AM EDT`. */
const TIME = String.raw`\d{1,2}:\d{2} [AP]M \S+`;

const message: MailMessage = {
	id: "u1",
	from: "ada@example.com",
	to: ["grace@example.com"],
	cc: [],
	subject: "Budget review",
	receivedDate: "2026-09-27T12:00:00Z",
	isUnread: false,
	hasAttachments: true,
	body: "Numbers attached.",
	isBodyTruncated: true,
	attachments: [{ id: "a", name: "q3.xlsx", isInline: false, kind: "file" }],
};

describe("mailMessageToMarkdown", () => {
	it("writes the headers, text, and a note when the text was cut", () => {
		const markdown = mailMessageToMarkdown(MAIL_APPS.microsoft, message);
		expect(markdown).toContain(
			"# Budget review\n\n**Source:** Outlook email  \n**From:** ada@example.com  \n",
		);
		expect(markdown).toMatch(
			new RegExp(
				String.raw`\*\*Received:\*\* Sun, Sep 27, 2026, ${TIME}  \n`,
			),
		);
		expect(markdown).toContain(
			"**Attachments:** q3.xlsx\n\nNumbers attached.",
		);
		expect(markdown).toContain("cut short");
		expect(markdown).not.toContain("**Cc:**");
	});

	it("names the mailbox it was read from", () => {
		expect(mailMessageToMarkdown(MAIL_APPS.google, message)).toContain(
			"**Source:** Gmail email",
		);
		expect(mailMessageToMarkdown(MAIL_APPS.google, message)).toContain(
			"read from Gmail",
		);
	});

	it("names the file after the subject", () => {
		expect(mailMessageFileName(message)).toBe("Email - Budget review.md");
		expect(mailMessageFileName({ ...message, subject: undefined })).toBe(
			"Email - No subject.md",
		);
	});
});

describe("mailThreadToMarkdown", () => {
	it("heads each email with its sender and keeps its own text's lines", () => {
		const markdown = mailThreadToMarkdown(MAIL_APPS.microsoft, [
			{
				...message,
				fromName: "Ada Lovelace",
				subject: "Budget review",
				sentDate: "2026-09-27T12:00:00Z",
				body: "Numbers attached.\n\nThanks\nAda",
				isBodyTruncated: false,
			},
			{
				...message,
				id: "u2",
				from: "grace@example.com",
				fromName: "Hopper, Grace",
				subject: "RE: Budget review",
				sentDate: "2026-09-27T13:00:00Z",
				uniqueBody: "Looks good.",
				// the whole body, with the history it quotes, was cut
				body: "Looks good.\n\nFrom: Ada\nSent: Sunday\nNumbers attached.",
				isBodyTruncated: true,
			},
		]);
		expect(markdown).toContain(
			"# Budget review\n\n**Source:** Outlook email thread  \n**Emails:** 2\n\n## Ada Lovelace\n\n**From:** ada@example.com  \n",
		);
		expect(markdown).toContain("Numbers attached.\n\nThanks  \nAda");
		expect(markdown).toContain(
			"## Hopper, Grace\n\n**From:** grace@example.com  \n",
		);
		expect(markdown).toMatch(
			new RegExp(String.raw`\*\*Sent:\*\* Sun, Sep 27, 2026, ${TIME}`),
		);
		expect(markdown).toContain("Looks good.\n");
		expect(markdown).not.toContain("cut short");
	});
});
