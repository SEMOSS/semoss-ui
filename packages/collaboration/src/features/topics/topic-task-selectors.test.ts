import { expect, it } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import { compareTopicTasks, selectTopicTasks } from "./topic-task-selectors";
import { directItem, savedTopic } from "./topic-test-fixtures";

function item(id: string, changes: Partial<WorkItem> = {}): WorkItem {
	return {
		...directItem,
		id,
		assignee: null,
		status: "open",
		askType: "errand",
		suggested: false,
		priority: "P2",
		score: 50,
		received: "2026-10-09T12:00:00Z",
		...changes,
	};
}

it("ranks by priority, score, recency and stable identity with unranked tasks last", () => {
	const tasks = [
		item("unranked", { priority: null, score: 100 }),
		item("b"),
		item("older", { received: "2026-10-08T12:00:00Z" }),
		item("no-score", { score: null }),
		item("a"),
		item("higher-score", { score: 80 }),
		item("priority", { priority: "P0", score: 0 }),
	];
	expect([...tasks].sort(compareTopicTasks).map((task) => task.id)).toEqual([
		"priority",
		"higher-score",
		"a",
		"b",
		"older",
		"no-score",
		"unranked",
	]);
});

it("includes source-less direct and multiple associations once, without changing input", () => {
	const tasks = [
		item("direct"),
		item("multiple", { topicIds: [savedTopic.id, "another"] }),
		item("thread-linked", { topicIds: [savedTopic.id], linkTopicId: null }),
		item("unrelated", { topicIds: ["another"], linkTopicId: null }),
	];
	const original = structuredClone(tasks);
	expect(
		selectTopicTasks(tasks, [], savedTopic.id).next.map((task) => task.id),
	).toEqual(["direct", "multiple", "thread-linked"]);
	expect(tasks).toEqual(original);
});

it("separates reviews, waiting, next actions and history while respecting source exclusions", () => {
	const template = createInitialCollaborationState().threads[0];
	const tasks = [
		item("review", { askType: "review" }),
		item("approval", { askType: "approve" }),
		item("reply", { askType: "reply" }),
		item("suggested-review", { askType: "review", suggested: true }),
		item("delegated-review", { askType: "review", assignee: "someone" }),
		item("waiting-on", { askType: "waiting_on" }),
		item("waiting", { status: "waiting" }),
		item("snoozed", { status: "snoozed" }),
		item("dismissed", { status: "dismissed" }),
		item("completed-old", {
			status: "done",
			completedAt: "2026-10-07T12:00:00Z",
		}),
		item("completed-new", {
			status: "done",
			completedAt: "2026-10-08T12:00:00Z",
		}),
		item("muted", { threadId: "muted" }),
		item("automated-open", { threadId: "automated" }),
		item("automated-done", {
			threadId: "automated",
			status: "done",
			completedAt: "2026-10-09T12:00:00Z",
		}),
	];
	const groups = selectTopicTasks(
		tasks,
		[
			{ ...template, id: "muted", muted: true },
			{ ...template, id: "automated", muted: false, automated: true },
		],
		savedTopic.id,
	);
	expect(groups.needsInput.map((task) => task.id)).toEqual([
		"approval",
		"review",
	]);
	expect(groups.next.map((task) => task.id)).toEqual([
		"reply",
		"suggested-review",
	]);
	expect(groups.waiting.map((task) => task.id)).toEqual([
		"delegated-review",
		"waiting",
		"waiting-on",
	]);
	expect(groups.snoozed.map((task) => task.id)).toEqual(["snoozed"]);
	expect(groups.completed.map((task) => task.id)).toEqual([
		"automated-done",
		"completed-new",
		"completed-old",
	]);
});
