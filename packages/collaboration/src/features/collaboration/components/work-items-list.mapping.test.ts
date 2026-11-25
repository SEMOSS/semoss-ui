import { expect, it } from "vitest";
import { isMyStep, type Step, toItem, toStep } from "./work-items-list";

const step = (overrides: Partial<Step> = {}): Step => ({
	id: "s1",
	text: "Send the report",
	status: "open",
	...overrides,
});

it("keeps the thread a step came from and when it was made", () => {
	const item = toItem({
		id: "t1",
		title: "Validate the rollback plan",
		mine: true,
		openSteps: [
			{
				id: "s1",
				text: "Attend the call",
				status: "open",
				threadId: "thread-9",
				createdAt: "2026-10-30 09:00:00",
			},
		],
	});
	expect(item.openSteps[0]).toMatchObject({
		threadId: "thread-9",
		createdAt: "2026-10-30 09:00:00",
	});
});

it("leaves the thread and date unset when the server sent none", () => {
	const item = toItem({
		id: "t1",
		title: "Validate the rollback plan",
		openSteps: [{ id: "s1", text: "Attend the call", status: "open" }],
	});
	expect(item.openSteps[0].threadId).toBeUndefined();
	expect(item.openSteps[0].createdAt).toBeUndefined();
	expect(item.closedAt).toBeUndefined();
});

it("reads when a step is due, and leaves it unset when it has no due date", () => {
	expect(
		toStep({ id: "s1", text: "Send it", status: "open", due: "2026-12-01" })
			.due,
	).toBe("2026-12-01");
	expect(toStep({ id: "s2", text: "Send it", status: "open" }).due).toBe(
		undefined,
	);
});

it("reads when a finished item was closed", () => {
	const item = toItem({
		id: "t2",
		title: "Kickoff deck",
		closedAt: "2026-11-10 17:30:00",
		openSteps: [],
	});
	expect(item.closedAt).toBe("2026-11-10 17:30:00");
});

it("counts a step as the owner's unless it is a hand-off to someone else", () => {
	// nobody was named: a group ask on the owner's item
	expect(isMyStep(step(), "me")).toBe(true);
	expect(isMyStep(step({ assigneeId: "me" }), "me")).toBe(true);
	expect(isMyStep(step({ assigneeId: "priya" }), "me")).toBe(false);
	expect(isMyStep(step({ kind: "waiting_on", assigneeId: "me" }), "me")).toBe(
		false,
	);
});
