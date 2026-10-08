import { describe, expect, it } from "vitest";
import { teamsMessageTitle, teamsThreadToMarkdown } from "./microsoft.markdown";
import type { TeamsMessage } from "./microsoft.types";

/*
 * Times are written in the zone of whoever runs the tests, so they are set at
 * midday UTC, which is the same day in almost every zone, and only the day is
 * compared exactly.
 */

/** A time of day and its zone, such as `8:00 AM EDT`. */
const TIME = String.raw`\d{1,2}:\d{2} [AP]M \S+`;

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
