import { describe, expect, it } from "vitest";
import {
	gmailMessageToMarkdown,
	googleEventToMarkdown,
	toGoogleDocText,
} from "./google.markdown";
import type { GoogleCalendarEvent } from "./google.types";

describe("Google files", () => {
	it("writes a Gmail email's people the way the files write people", () => {
		const markdown = gmailMessageToMarkdown({
			id: "g",
			from: '"Lovelace, Ada" <ada@example.com>',
			to: "grace@example.com",
			subject: "Hi",
			content: "Hello\nthere",
		});
		expect(markdown).toContain(
			"**From:** Lovelace, Ada (ada@example.com)  \n**To:** grace@example.com",
		);
		expect(markdown).toContain("Hello  \nthere");
	});

	it("reads a Google event's times in the user's zone", () => {
		const event: GoogleCalendarEvent = {
			id: "g",
			summary: "Review",
			attendees: [
				{ email: "ada@example.com", responseStatus: "accepted" },
			],
			startTime: "2026-09-27T09:00:00",
			endTime: "2026-09-27T10:00:00",
			hangoutLink: "https://meet.google.com/abc-defg",
		};
		const markdown = googleEventToMarkdown(event);
		expect(markdown).toContain(
			"**When:** Sun, Sep 27, 2026, 9:00 AM to 10:00 AM ",
		);
		expect(markdown).toContain("**Guests:** ada@example.com (accepted)");
		expect(markdown).toContain(
			"**Google Meet:** [meet.google.com](https://meet.google.com/abc-defg)",
		);
		expect(
			googleEventToMarkdown({ ...event, startTime: "2026-09-27" }),
		).toContain("**When:** Sun, Sep 27, 2026, all day");
	});

	it("sets a Google Doc's paragraphs a blank line apart", () => {
		expect(toGoogleDocText("One\nTwo\vthree\n")).toBe(
			"One\n\nTwo\nthree\n\n",
		);
	});
});
