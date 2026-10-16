import { describe, expect, it, vi } from "vitest";
import { createLiveSync } from "@/features/collaboration/live/live-sync";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { collaborationReducer } from "@/features/collaboration/state/collaboration.reducer";
import type { CollaborationCommand } from "@/features/collaboration/state/collaboration.types";
import type { InsightActions } from "@/lib/pixel";
import { readReviewOverview } from "./brain-review-api";

const NOW = "2026-10-15T12:00:00.000Z";

describe("Review server boundaries", () => {
	it("rejects an invalid overview instead of displaying an empty Review", async () => {
		const run = vi.fn().mockResolvedValue({
			pixelReturn: [
				{ operationType: ["OPERATION"], output: { pending: [] } },
			],
		});
		await expect(
			readReviewOverview({ run } as unknown as InsightActions),
		).rejects.toThrow("unexpected shape");
	});

	it("updates unchanged records while preserving edits and rows outside the fetched page", () => {
		const before = createInitialCollaborationState();
		const current = structuredClone(before);
		const next = structuredClone(before);
		current.topics[0].name = "Owner edited while loading";
		next.topics[0].name = "Older server name";
		next.topics[1].name = "New server name";
		next.topics = next.topics.slice(0, 2);
		const result = collaborationReducer(
			current,
			{ type: "review.refresh", before, next },
			NOW,
		);
		expect(result.topics[0].name).toBe("Owner edited while loading");
		expect(result.topics[1].name).toBe("New server name");
		expect(result.topics).toHaveLength(before.topics.length);
	});

	it("removes an accepted merge source without removing unrelated topics", () => {
		const before = createInitialCollaborationState();
		const source = before.topics[0].id;
		const next = structuredClone(before);
		next.topics = next.topics.filter((topic) => topic.id !== source);
		const result = collaborationReducer(
			before,
			{ type: "review.refresh", before, next, removedTopicIds: [source] },
			NOW,
		);
		expect(result.topics.some((topic) => topic.id === source)).toBe(false);
		expect(result.topics).toHaveLength(before.topics.length - 1);
	});

	it("does not save server refreshes back when batched with an owner edit", async () => {
		const before = createInitialCollaborationState();
		const remote = structuredClone(before);
		remote.topics[0].name = "Applied by the Review answer";
		const refresh: CollaborationCommand = {
			type: "review.refresh",
			before,
			next: remote,
		};
		const edit: CollaborationCommand = {
			type: "topic.save",
			topic: { id: before.topics[1].id, name: "Local owner rename" },
		};
		const refreshed = collaborationReducer(before, refresh, NOW);
		const next = collaborationReducer(refreshed, edit, NOW);
		const run = vi.fn(async (_statement: string) => ({
			pixelReturn: [{ operationType: ["OPERATION"], output: true }],
		}));
		const onError = vi.fn();
		const sync = createLiveSync(
			{ run } as unknown as InsightActions,
			onError,
		);
		sync({ previous: before, next, commands: [refresh, edit] });
		await sync.settled();
		expect(run).toHaveBeenCalledTimes(1);
		expect(run.mock.calls[0][0]).toContain("Local owner rename");
		expect(run.mock.calls[0][0]).not.toContain(
			"Applied by the Review answer",
		);
		expect(onError).not.toHaveBeenCalled();
	});
});
