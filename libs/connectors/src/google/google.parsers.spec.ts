import { describe, expect, it } from "vitest";
import {
	formatLocalWallClock,
	parseLocalWallClock,
} from "@semoss/utility/date";
import { toPlainText } from "../core/connector.format";
import {
	gmailMessageToMarkdown,
	googleDocToMarkdown,
	googleEventToMarkdown,
} from "./google.markdown";
import {
	parseDriveFiles,
	parseGmailList,
	parseGmailMessage,
	parseGoogleCalendarDays,
	parseGoogleCalendarEvent,
	parseGoogleDocContent,
	parseGoogleDocs,
} from "./google.parsers";
import { GOOGLE_PIXELS, getDriveFileUrl } from "./google.pixels";

describe("Google parsers", () => {
	it("reads Drive files by name, dropping entries without an id", () => {
		const files = parseDriveFiles([
			{ id: "2", name: "beta.pdf", mimeType: "application/pdf" },
			{ name: "no id" },
			{ id: "1", name: "Alpha" },
		]);
		expect(files.map((file) => file.name)).toEqual(["Alpha", "beta.pdf"]);
	});

	it("reads Gmail listings, keeping the preview", () => {
		const [message] = parseGmailList([
			{
				id: "m1",
				subject: "Hi",
				from: "Ada <ada@example.com>",
				pre_content: "Hello",
			},
		]);
		expect(message).toEqual({
			id: "m1",
			subject: "Hi",
			from: "Ada <ada@example.com>",
			snippet: "Hello",
		});
	});

	it("gives a read email the id it was read with", () => {
		const message = parseGmailMessage("m1")({
			from: "ada@example.com",
			content: "<p>Hi</p>",
		});
		expect(message.id).toBe("m1");
		expect(message.content).toBe("<p>Hi</p>");
	});

	it("reads calendar days, earliest first, dropping empty ones", () => {
		const days = parseGoogleCalendarDays([
			{ date: "2026-09-28", events: [{ id: "b", summary: "Later" }] },
			{
				date: "2026-09-27",
				events: [{ id: "a", recurringEventId: "r" }],
			},
			{ date: "2026-09-29", events: [] },
		]);
		expect(days.map((day) => day.date)).toEqual([
			"2026-09-27",
			"2026-09-28",
		]);
		expect(days[0].events[0].recurringEventId).toBe("r");
	});

	it("reads an event with its guests", () => {
		const event = parseGoogleCalendarEvent("e1")({
			summary: "Sync",
			startTime: "2026-09-27T09:00:00",
			attendees: [
				{ email: "grace@example.com", responseStatus: "accepted" },
				{},
			],
			hangoutLink: "https://meet.example/abc",
		});
		expect(event).toMatchObject({ id: "e1", summary: "Sync" });
		expect(event.attendees).toHaveLength(1);
	});

	it("reads documents and their text", () => {
		expect(parseGoogleDocs([{ id: "d", title: "Plan" }])).toEqual([
			{ id: "d", title: "Plan" },
		]);
		expect(
			parseGoogleDocContent({ title: "Plan", content: "Step one\n" }),
		).toEqual({
			title: "Plan",
			content: "Step one\n",
		});
	});

	it("refuses responses of the wrong shape", () => {
		expect(() => parseDriveFiles({ files: [] })).toThrow();
		expect(() => parseGoogleDocContent("nope")).toThrow();
	});
});

describe("Google pixels and links", () => {
	it("builds the reactor calls", () => {
		expect(GOOGLE_PIXELS.gmailRead("m1")).toBe(
			'GoogleGmailReadEmail(id=["m1"]);',
		);
		expect(
			GOOGLE_PIXELS.calendarList({
				startDate: "2026-09-27T00:00:00",
				endDate: "2026-10-03T23:59:59",
			}),
		).toBe(
			'GoogleCalendarList(startDate=["2026-09-27T00:00:00"], endDate=["2026-10-03T23:59:59"]);',
		);
	});

	it("opens Google's own files in their editors", () => {
		expect(
			getDriveFileUrl("a", "application/vnd.google-apps.document"),
		).toBe("https://docs.google.com/document/d/a/edit");
		expect(getDriveFileUrl("b", "application/pdf")).toBe(
			"https://drive.google.com/file/d/b/view",
		);
	});
});

describe("Google text", () => {
	it("reads HTML email as plain text, keeping its lines", () => {
		expect(
			toPlainText(
				"<div>Hello<br>there</div><script>alert(1)</script><p>Bye</p>",
			),
		).toBe("Hello\nthere\nBye");
		expect(toPlainText("Already plain")).toBe("Already plain");
	});

	it("keeps where a link goes when its text does not show it", () => {
		expect(
			toPlainText(
				'<p>Join <a href="https://meet.google.com/abc-defg">here</a></p>' +
					'<p><a href="https://example.com/">example.com</a> or ' +
					'<a href="mailto:ada@example.com">ada@example.com</a></p>' +
					'<p><a href="https://example.com/logo"><img src="logo.png"></a></p>',
			),
		).toBe(
			"Join here<https://meet.google.com/abc-defg>\nexample.com or ada@example.com",
		);
	});

	it("writes wall clock times and reads them back as local time", () => {
		const date = new Date(2026, 8, 27, 9, 5, 0);
		expect(formatLocalWallClock(date)).toBe("2026-09-27T09:05:00");
		expect(parseLocalWallClock("2026-09-27T09:05:00")?.getTime()).toBe(
			date.getTime(),
		);
		expect(parseLocalWallClock("2026-09-27")?.getHours()).toBe(0);
		expect(parseLocalWallClock("soon")).toBeNull();
	});

	it("writes Gmail, events, and docs as Markdown", () => {
		expect(
			gmailMessageToMarkdown({
				id: "m",
				subject: "Hi",
				from: "ada@example.com",
				content: "<p>Numbers</p>",
			}),
		).toContain("Numbers");
		expect(
			googleEventToMarkdown({
				id: "e",
				summary: "Sync",
				startTime: "2026-09-27T09:00:00",
				endTime: "2026-09-27T09:30:00",
				attendees: [
					{ email: "grace@example.com", responseStatus: "accepted" },
				],
				frequency: "WEEKLY",
			}),
		).toContain(
			"**Repeats:** weekly  \n**Guests:** grace@example.com (accepted)",
		);
		expect(
			googleDocToMarkdown(
				{ title: "Plan", content: "Step" },
				"https://x",
			),
		).toContain("**Link:** [x](https://x)\n\nStep");
	});
});
