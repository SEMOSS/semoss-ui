import { expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import {
	createTopic,
	readTopicItems,
	topicDetailSchema,
	workItemSchema,
} from "./api/topic-api";
import { directItem, savedTopic } from "./topic-test-fixtures";

const result = (output: unknown) => ({
	pixelReturn: [{ output, operationType: [] }],
});

it("creates a canonical topic once with only the provided fields and backend defaults", async () => {
	const run = vi
		.fn()
		.mockResolvedValue(result({ ...savedTopic, kind: null, color: null }));
	const topic = await createTopic({ run } as unknown as InsightActions, {
		name: "  India trip  ",
		description: " ",
	});
	expect(run).toHaveBeenCalledExactlyOnceWith(
		'BrainSaveTopic(topic=[{"name":"India trip"}]);',
	);
	expect(topic).toMatchObject({
		id: savedTopic.id,
		name: "India trip",
		status: "active",
		isSample: false,
	});
});

it("rejects missing identity, incomplete detail, and invalid goal state rather than inventing success", async () => {
	expect(
		topicDetailSchema.safeParse({ id: "partial", name: "Partial" }).success,
	).toBe(false);
	expect(
		topicDetailSchema.safeParse({
			...savedTopic,
			goals: [{ noteId: "goal", text: "Goal", state: "open" }],
		}).success,
	).toBe(false);
	const run = vi.fn().mockResolvedValue(result({ ...savedTopic, id: "" }));
	await expect(
		createTopic({ run } as unknown as InsightActions, {
			name: "Trip",
			description: "",
		}),
	).rejects.toThrow("unexpected shape");
	await expect(
		createTopic({ run } as unknown as InsightActions, {
			name: " ",
			description: "",
		}),
	).rejects.toThrow("Name is required");
	expect(run).toHaveBeenCalledOnce();
});

it("follows topic-scoped task pages and preserves direct links, nullable source, room and assignee", async () => {
	const run = vi
		.fn()
		.mockResolvedValueOnce(
			result({
				items: [{ ...directItem, threadId: null }],
				total: 2,
				fyiCount: 200,
			}),
		)
		.mockResolvedValueOnce(
			result({ items: [{ ...directItem, id: "second" }], total: 2 }),
		);
	const onPage = vi.fn();
	const items = await readTopicItems(
		{ run } as unknown as InsightActions,
		savedTopic.id,
		onPage,
		() => false,
	);
	expect(items).toHaveLength(2);
	expect(items[0]).toMatchObject({
		threadId: "",
		linkTopicId: savedTopic.id,
		topicIds: [],
		roomId: "room-task",
		assignee: "person-owner",
	});
	expect(run.mock.calls[1][0]).toContain("offset=[1]");
	expect(run.mock.calls[0][0]).toContain(
		'view=["all"], topicId=["topic-server"], sort=["priority"]',
	);
	expect(onPage).toHaveBeenCalledTimes(2);
	expect(
		workItemSchema.safeParse({ ...directItem, priority: "high" }).success,
	).toBe(false);
});

it.each(["changed total", "overlap", "empty page"])(
	"keeps partial pages explicit on %s",
	async (failure) => {
		const next =
			failure === "changed total"
				? { items: [], total: 3 }
				: failure === "overlap"
					? { items: [directItem], total: 2 }
					: { items: [], total: 2 };
		const run = vi
			.fn()
			.mockResolvedValueOnce(result({ items: [directItem], total: 2 }))
			.mockResolvedValueOnce(result(next));
		const onPage = vi.fn();
		await expect(
			readTopicItems(
				{ run } as unknown as InsightActions,
				savedTopic.id,
				onPage,
				() => false,
			),
		).rejects.toThrow(/changed|overlapping/);
		expect(onPage).toHaveBeenCalledOnce();
	},
);

it("rejects unrelated topic tasks and stops continuation after cancellation", async () => {
	const run = vi.fn().mockResolvedValue(
		result({
			items: [{ ...directItem, linkTopicId: "other" }],
			total: 1,
		}),
	);
	await expect(
		readTopicItems(
			{ run } as unknown as InsightActions,
			savedTopic.id,
			vi.fn(),
			() => false,
		),
	).rejects.toThrow("unrelated topic");
	await expect(
		readTopicItems(
			{ run } as unknown as InsightActions,
			savedTopic.id,
			vi.fn(),
			() => true,
		),
	).rejects.toThrow("cancelled");
	expect(run).toHaveBeenCalledOnce();
});
