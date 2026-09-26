import { expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { collaborationReducer } from "../state/collaboration.reducer";
import type { CollaborationCommand } from "../state/collaboration.types";
import { createLiveSync } from "./live-sync";

const NOW = "2026-09-26T12:00:00.000Z";

function fakeActions() {
	const sent: string[] = [];
	const run = vi.fn(async (joined: string) => {
		const statements = joined.split(/;\s*(?=[A-Z])/).filter(Boolean);
		sent.push(...statements.map((s) => (s.endsWith(";") ? s : `${s};`)));
		return {
			pixelReturn: statements.map((statement) => ({
				operationType: ["OPERATION"],
				output: statement.startsWith("BrainMergeTopics(")
					? { topicId: "t-geng", changeId: "change-1" }
					: true,
			})),
		};
	});
	return { actions: { run } as unknown as InsightActions, sent };
}

function step(command: CollaborationCommand) {
	const previous = createInitialCollaborationState();
	return {
		previous,
		next: collaborationReducer(previous, command, NOW),
		commands: [command],
	};
}

it("undoing a merge sends only BrainUndoTopicChange with the merge's changeId", async () => {
	const { actions, sent } = fakeActions();
	const onError = vi.fn();
	const sync = createLiveSync(actions, onError);
	const merge = step({
		type: "topic.merge",
		sourceId: "t-geng",
		targetId: "t-gsales",
	});
	sync({ ...merge, undo: false });
	sync({
		previous: merge.next,
		next: merge.previous,
		commands: [],
		undo: true,
	});
	await vi.waitFor(() => expect(sent).toHaveLength(2));
	expect(sent[0]).toMatch(/^BrainMergeTopics\(/);
	expect(sent[1]).toBe('BrainUndoTopicChange(changeId=["change-1"]);');
	expect(onError).not.toHaveBeenCalled();
});

it("an undo that brings back no removed topic is saved as a normal change", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const rename = step({
		type: "topic.save",
		topic: { id: "t-geng", name: "Renamed" },
	});
	sync({ ...rename, undo: false });
	sync({
		previous: rename.next,
		next: rename.previous,
		commands: [],
		undo: true,
	});
	await vi.waitFor(() => expect(sent).toHaveLength(2));
	expect(sent.some((s) => s.startsWith("BrainUndoTopicChange"))).toBe(false);
	expect(sent[1]).toMatch(/^BrainSaveTopic\(/);
});
