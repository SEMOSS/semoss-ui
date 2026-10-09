import {
	calendarUtc,
	importCalendarEvent,
	importOutlookMail,
	importTeamsChat,
} from "./source-mapping";

it("preserves separate Outlook UIDs even when subjects match", () => {
	const base = {
		messageId: null,
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
			{
				uid: "one",
				messageId: null,
				unread: false,
				hasAttachments: false,
			},
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
	expect(calendarUtc("2026-09-25T10:00:00Z")).toBe(
		"2026-09-25T10:00:00.000Z",
	);
	// a whole day event comes back as its date
	expect(calendarUtc("2026-09-25")).toBe("2026-09-25T00:00:00.000Z");
	expect(() => calendarUtc("not a date")).toThrow("invalid date");
	const source = importCalendarEvent({
		id: "event",
		start: "2026-09-25T10:00:00Z",
		timeZone: "America/New_York",
		body: "Agenda",
		attendees: [],
	});
	expect(source.receivedAt).toBe("2026-09-25T10:00:00.000Z");
	expect(source.participants).toEqual([]);
});
