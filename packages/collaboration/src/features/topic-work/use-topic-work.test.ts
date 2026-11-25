import { expect, it } from "vitest";
import { toItem } from "@/features/collaboration/components/work-items-list";
import { groupTopicWork, RECENTLY_DONE_LIMIT } from "./use-topic-work";

/** A work item as WorkListMyWork returns it. */
const item = (id: string, extra: Record<string, unknown> = {}) =>
	toItem({ id, title: `Item ${id}`, state: "active", mine: true, ...extra });

const mineStep = { id: "m", text: "Draft the agenda", status: "open" };
const owedStep = {
	id: "o",
	text: "Send the policy",
	status: "open",
	kind: "waiting_on",
	assigneeId: "priya",
};

it("puts an item with a step of the owner's under yours, and one that waits on someone under waiting, as the Work page does", () => {
	const both = item("both", { openSteps: [mineStep, owedStep] });
	const onlyMine = item("mine", { openSteps: [mineStep] });
	const onlyOwed = item("owed", { openSteps: [owedStep] });
	const work = groupTopicWork([both, onlyMine, onlyOwed], [], "me");
	expect(work.yours.map((i) => i.id)).toEqual(["both", "mine"]);
	expect(work.waiting.map((i) => i.id)).toEqual(["both", "owed"]);
});

it("leaves out items still in review and items other people are driving", () => {
	const work = groupTopicWork(
		[
			item("review", { state: "proposed", openSteps: [mineStep] }),
			item("theirs", { mine: false, openSteps: [owedStep] }),
		],
		[],
		"me",
	);
	expect(work.yours).toEqual([]);
	expect(work.waiting).toEqual([]);
});

it("treats a step as the owner's by who it is for", () => {
	const work = groupTopicWork([], [], "me");
	expect(work.isMine({ ...mineStep, assigneeId: "me" })).toBe(true);
	expect(work.isMine({ ...mineStep, assigneeId: "priya" })).toBe(false);
	expect(work.isMine(owedStep)).toBe(false);
});

it("shows the latest finished items, newest first, up to the limit", () => {
	const finished = Array.from({ length: RECENTLY_DONE_LIMIT + 2 }, (_, i) =>
		item(`d${i}`, { closedAt: `2026-11-0${i + 1}T12:00:00` }),
	);
	const work = groupTopicWork([], finished, "me");
	expect(work.done).toHaveLength(RECENTLY_DONE_LIMIT);
	expect(work.done[0].id).toBe(`d${RECENTLY_DONE_LIMIT + 1}`);
	expect(work.done.map((i) => i.closedAt)).toEqual(
		[...work.done.map((i) => i.closedAt)].sort().reverse(),
	);
});

it("counts every finished item, including the ones the list leaves out", () => {
	const finished = Array.from({ length: RECENTLY_DONE_LIMIT + 2 }, (_, i) =>
		item(`d${i}`, { closedAt: `2026-11-0${i + 1}T12:00:00` }),
	);
	const cut = groupTopicWork([], finished, "me");
	expect(cut.done).toHaveLength(RECENTLY_DONE_LIMIT);
	expect(cut.doneTotal).toBe(RECENTLY_DONE_LIMIT + 2);
	// nothing left out: the total is simply the list
	const few = groupTopicWork([], finished.slice(0, 2), "me");
	expect(few.doneTotal).toBe(2);
	expect(few.done).toHaveLength(2);
});

it("keeps the steps that belong to no work item as they came", () => {
	const single = [
		{ id: "l1", text: "Confirm the venue", status: "open" },
		{ id: "l2", text: "Book the caterer", status: "open" },
	];
	expect(groupTopicWork([], [], "me", single).single).toEqual(single);
	expect(groupTopicWork([], [], "me").single).toEqual([]);
});

it("does not reorder the list it was given", () => {
	const finished = [
		item("old", { closedAt: "2026-11-01T12:00:00" }),
		item("new", { closedAt: "2026-11-05T12:00:00" }),
	];
	groupTopicWork([], finished, "me");
	expect(finished.map((i) => i.id)).toEqual(["old", "new"]);
});
