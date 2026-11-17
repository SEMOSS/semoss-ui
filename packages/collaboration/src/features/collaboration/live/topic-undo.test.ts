import { beforeEach, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import type { TopicChange } from "./live-sync";
import { offerTopicUndo, undoTopicChange } from "./topic-undo";

const toasts = vi.hoisted(() => ({
	success: vi.fn(),
	error: vi.fn(),
}));
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<object>()),
	toast: toasts,
}));

const change: TopicChange = {
	kind: "delete",
	changeId: "change-9",
	topicId: "t-1",
	name: "Pricing",
};

function actionsReturning(entry: { operationType: string[]; output: unknown }) {
	const run = vi.fn(async () => ({ pixelReturn: [entry] }));
	return { run, actions: { run } as unknown as InsightActions };
}

beforeEach(() => vi.clearAllMocks());

it("undo sends the saved change id, then reads the data again", async () => {
	const { run, actions } = actionsReturning({
		operationType: ["OPERATION"],
		output: { changeId: "undo-1" },
	});
	const reload = vi.fn(async () => {});
	await undoTopicChange(actions, change, reload);
	expect(run).toHaveBeenCalledWith(
		'BrainUndoTopicChange(changeId=["change-9"]);',
	);
	expect(reload).toHaveBeenCalledOnce();
	expect(toasts.success).toHaveBeenCalledWith("Pricing is back.");
});

it("an undo the server refuses says why and does not reload", async () => {
	const { actions } = actionsReturning({
		operationType: ["ERROR"],
		output: "Change already undone",
	});
	const reload = vi.fn(async () => {});
	await undoTopicChange(actions, change, reload);
	expect(reload).not.toHaveBeenCalled();
	expect(toasts.error).toHaveBeenCalledWith(
		"Could not undo: Change already undone",
	);
});

it("the saved notice carries an Undo that replaces the dialog's toast", () => {
	const undo = vi.fn();
	offerTopicUndo({ ...change, kind: "merge", intoName: "Sales" }, undo);
	const [message, options] = toasts.success.mock.calls[0] ?? [];
	expect(message).toBe("Merged Pricing into Sales.");
	expect(options.id).toBe("topic-change-t-1");
	options.action.onClick();
	expect(undo).toHaveBeenCalledOnce();
});
