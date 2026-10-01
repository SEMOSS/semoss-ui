import { describe, expect, it } from "vitest";
import {
	calendarEventToMarkdown,
	outlookMessageFileName,
	outlookMessageToMarkdown,
	outlookThreadToMarkdown,
	teamsMessageTitle,
	teamsThreadToMarkdown,
} from "./microsoft.markdown";
import type {
	CalendarEvent,
	OutlookMessage,
	TeamsMessage,
} from "./microsoft.types";

/*
 * Times are written in the zone of whoever runs the tests, so they are set at
 * midday UTC, which is the same day in almost every zone, and only the day is
 * compared exactly.
 */

/** A time of day and its zone, such as `8:00 AM EDT`. */
const TIME = String.raw`\d{1,2}:\d{2} [AP]M \S+`;

const message: OutlookMessage = {
	uid: "u1",
	from: "ada@example.com",
	to: "grace@example.com",
	subject: "Budget review",
	receivedDate: "2026-09-27T12:00:00Z",
	isUnread: false,
	hasAttachments: true,
	body: "Numbers attached.",
	isBodyTruncated: true,
	attachments: [{ id: "a", name: "q3.xlsx", isInline: false, isFile: true }],
};

const reply = (id: string, body: string): TeamsMessage => ({
	id: id,
	isDeleted: false,
	fromName: "Grace",
	createdDateTime: "2026-09-27T12:00:00Z",
	body: body,
	isBodyTruncated: false,
	attachments: [],
	replies: [],
});

describe("outlookMessageToMarkdown", () => {
	it("writes the headers, text, and a note when the text was cut", () => {
		const markdown = outlookMessageToMarkdown(message);
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

	it("names the file after the subject", () => {
		expect(outlookMessageFileName(message)).toBe(
			"Email - Budget review.md",
		);
		expect(outlookMessageFileName({ ...message, subject: undefined })).toBe(
			"Email - No subject.md",
		);
	});
});

describe("outlookThreadToMarkdown", () => {
	it("heads each email with its sender and keeps its own text's lines", () => {
		const markdown = outlookThreadToMarkdown([
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
				uid: "u2",
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

describe("calendarEventToMarkdown", () => {
	it("says when and where, and links the meeting by its site", () => {
		const event: CalendarEvent = {
			id: "e",
			subject: "Sync",
			start: "2026-09-27T12:00:00.0000000",
			startTimeZone: "UTC",
			end: "2026-09-27T12:30:00.0000000",
			isAllDay: false,
			location: "Room 4",
			organizer: "ada@example.com",
			organizerName: "Ada",
			attendees: [
				{ name: "Lovelace, Ada", address: "ada@example.com" },
				{ name: "Grace", response: "accepted" },
			],
			joinUrl: "https://teams.example/join",
			isOnlineMeeting: true,
			isCancelled: false,
			body: `Agenda.\n${"_".repeat(40)}\nJoin<https://teams.example/join>`,
			isBodyTruncated: false,
		};
		const markdown = calendarEventToMarkdown(event);
		expect(markdown).toMatch(
			new RegExp(
				String.raw`\*\*When:\*\* Sun, Sep 27, 2026, \d{1,2}:\d{2} [AP]M to ${TIME}  \n`,
			),
		);
		expect(markdown).toContain("**Organizer:** Ada (ada@example.com)");
		expect(markdown).toContain(
			"**Attendees:** Lovelace, Ada (ada@example.com); Grace (accepted)",
		);
		expect(markdown).toContain(
			"**Online meeting:** [teams.example](https://teams.example/join)",
		);
		expect(markdown).toContain(
			"Agenda.\n\n---\n\nJoin ([teams.example](https://teams.example/join))",
		);
	});

	it("names the day of an all day event", () => {
		const markdown = calendarEventToMarkdown({
			id: "e",
			start: "2026-09-27T00:00:00.0000000",
			end: "2026-09-28T00:00:00.0000000",
			isAllDay: true,
			attendees: [],
			isOnlineMeeting: false,
			isCancelled: false,
			isBodyTruncated: false,
		});
		expect(markdown).toContain("**When:** Sun, Sep 27, 2026, all day");
	});
});

describe("teamsThreadToMarkdown", () => {
	it("writes the first message and each reply as sections", () => {
		const thread: TeamsMessage = {
			...reply("root", "Can we ship Friday?"),
			fromName: "Ada",
			replies: [reply("r1", "Yes")],
		};
		const markdown = teamsThreadToMarkdown(
			thread,
			{ id: "t", displayName: "Launch" },
			{ id: "c", displayName: "General" },
		);
		expect(markdown).toContain("**Team:** Launch");
		expect(markdown).toContain("**Replies:** 1");
		expect(markdown).toMatch(
			new RegExp(
				String.raw`## Ada\n\n\*\*Sent:\*\* Sun, Sep 27, 2026, ${TIME}\n\nCan we ship Friday\?`,
			),
		);
		expect(markdown).toMatch(/## Grace\n\n\*\*Sent:\*\* [^\n]+\n\nYes/);
	});
});

describe("teamsMessageTitle", () => {
	it("uses the subject, or the start of the text cut at a word", () => {
		expect(teamsMessageTitle({ ...reply("a", "x"), subject: "Plan" })).toBe(
			"Plan",
		);
		expect(
			teamsMessageTitle(reply("b", "one two three four five six"), 12),
		).toBe("one two...");
	});
});
