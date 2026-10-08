import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { dashboardTimeZone, eventStart } from "./dashboard-calendar";
import { dayKey, prioritizeItems, relevantEmails } from "./dashboard-selectors";

it("groups meetings by local day around midnight and daylight saving boundaries", () => {
	expect(dayKey(new Date("2026-10-07T02:30:00Z"), "America/New_York")).toBe(
		"2026-10-06",
	);
	expect(dayKey(new Date("2026-11-01T05:30:00Z"), "America/New_York")).toBe(
		"2026-11-01",
	);
	expect(
		eventStart({
			id: "one",
			start: "2026-10-07T02:30:00Z",
			attendees: [],
		})?.toISOString(),
	).toBe("2026-10-07T02:30:00.000Z");
	expect(eventStart({ id: "bad", start: "bad", attendees: [] })).toBeNull();
	expect(() => dashboardTimeZone("invalid-zone")).not.toThrow();
});

it("ranks actual priority above confidence while preserving an explicit recency view", () => {
	const seed = createInitialCollaborationState().items[0];
	const items = [
		{
			...seed,
			id: "urgent",
			priority: "P0" as const,
			score: 1,
			received: "2026-10-01",
		},
		{
			...seed,
			id: "new",
			priority: "P2" as const,
			score: 99,
			received: "2026-10-02",
		},
	];
	expect(prioritizeItems(items)[0].id).toBe("urgent");
	expect(prioritizeItems(items, true)[0].id).toBe("new");
});

it("does not invent pending replies from unread flags or reintroduce ignored email", () => {
	const state = createInitialCollaborationState();
	state.threads[0] = {
		...state.threads[0],
		muted: true,
		source: { kind: "outlook", nativeId: "ignored" },
	};
	const rows = relevantEmails(state, [
		{
			uid: "unread",
			from: "someone@example.com",
			subject: "Hello",
			unread: true,
			hasAttachments: false,
		},
		{ uid: "ignored", unread: true, hasAttachments: false },
	]);
	expect(rows.find((row) => row.id === "unread")?.reason).toBe(
		"Unread in your inbox",
	);
	expect(rows.some((row) => row.mail?.uid === "ignored")).toBe(false);
});
