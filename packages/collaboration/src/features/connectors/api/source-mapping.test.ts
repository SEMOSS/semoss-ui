import {
	calendarUtc,
	importCalendarEvent,
	importOutlookMail,
	importTeamsChat,
} from "./source-mapping";

it("preserves separate Outlook UIDs even when subjects match", () => {
	const base = {
		subject: "Same subject",
		body: "Text",
		unread: false,
		hasAttachments: false,
	};
	const first = importOutlookMail({ ...base, uid: "one" }, "inbox");
	const second = importOutlookMail({ ...base, uid: "two" }, "inbox");
	expect(first.nativeId).not.toBe(second.nativeId);
	expect(first.participants).toEqual([]);
	expect(first.receivedAt).toBeUndefined();
});

it("refuses to import an email that has only been listed", () => {
	expect(() =>
		importOutlookMail(
			{ uid: "one", unread: false, hasAttachments: false },
			"inbox",
		),
	).toThrow("Read this email");
});

it("keeps missing Teams contact addresses absent and sorts messages chronologically", () => {
	const source = importTeamsChat(
		{ id: "chat", members: [{ userId: "native-person", name: "Person" }] },
		{
			chatId: "chat",
			count: 2,
			messages: [
				{
					id: "two",
					body: "Later",
					fromId: "native-person",
					createdDateTime: "2026-09-25T10:00:00Z",
				},
				{
					id: "one",
					body: "Earlier",
					fromId: "native-person",
					createdDateTime: "2026-09-25T09:00:00Z",
				},
			],
		},
	);
	expect(source.participants[0]?.address).toBeUndefined();
	expect(source.messages.map((message) => message.id)).toEqual([
		"one",
		"two",
	]);
});

it("normalizes UTC calendar moments without treating them as browser-local time", () => {
	expect(calendarUtc("2026-09-25T10:00:00.0000000", "UTC")).toBe(
		"2026-09-25T10:00:00.000Z",
	);
	expect(() =>
		calendarUtc("2026-09-25T10:00:00", "Eastern Standard Time"),
	).toThrow("unexpected time zone");
	const source = importCalendarEvent({
		id: "event",
		start: "2026-09-25T10:00:00",
		startTimeZone: "UTC",
		body: "Agenda",
		attendees: [],
	});
	expect(source.receivedAt).toBe("2026-09-25T10:00:00.000Z");
	expect(source.participants).toEqual([]);
});
