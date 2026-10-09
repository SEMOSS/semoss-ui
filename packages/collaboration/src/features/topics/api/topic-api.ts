import { z } from "@semoss/ui/next";
import { mapItem, mapTopic } from "@/features/collaboration/live/live-state";
import type {
	Topic,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** The full topic response shared by topic creation and detail reads. */
export const topicDetailSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	short: z.string().nullish(),
	accountId: z.string().nullish(),
	kind: z.enum(["client", "internal", "event", "personal"]).nullish(),
	color: z.string().nullish(),
	status: z.enum(["suggested", "active", "dormant", "archived"]),
	description: z.string().nullish(),
	keywords: z.array(z.string()).nullish(),
	calendarSeries: z.array(z.string()).nullish(),
	goals: z.array(
		z.object({
			noteId: z.string().min(1),
			text: z.string(),
			status: z.enum(["open", "done"]),
		}),
	),
	people: z.array(
		z.object({
			personId: z.string().min(1),
			role: z.string().nullish(),
			engagement: z.number().nullable(),
			state: z.enum(["member", "suggested", "removed"]),
			origin: z.enum(["you", "brain", "assistant"]).nullish(),
			reason: z.string().nullish(),
		}),
	),
	stats: z.object({
		threads: z.number().int().nonnegative(),
		openItems: z.number().int().nonnegative(),
		lastActivity: z.string().nullable(),
	}),
});

/** Work updates use `due`, and topic associations can exist without a source thread. */
export const workItemSchema = z.object({
	id: z.string().min(1),
	threadId: z.string().nullish(),
	channel: z.enum(["email", "teams", "calendar", "room", "task"]),
	actorId: z.string().nullish(),
	actorName: z.string().nullish(),
	title: z.string(),
	askType: z.enum([
		"reply",
		"approve",
		"attend",
		"review",
		"waiting_on",
		"errand",
		"fyi",
	]),
	priority: z.enum(["P0", "P1", "P2", "P3"]).nullable(),
	score: z.number().nullable(),
	reasons: z.array(z.string()),
	due: z.string().nullable(),
	received: z.string().nullable(),
	status: z.enum(["open", "waiting", "done", "dismissed", "snoozed"]),
	topicIds: z.array(z.string()),
	linkTopicId: z.string().nullish(),
	roomId: z.string().nullish(),
	assignee: z.string().nullish(),
	suggested: z.boolean().optional(),
	origin: z.string().nullish(),
	snoozeUntil: z.string().nullish(),
	closedReason: z.string().nullish(),
	closedAt: z.string().nullish(),
});

const PAGE_SIZE = 100;
const MAX_PAGES = 100;

/** Create once and return the canonical persisted identity and backend defaults. */
export async function createTopic(
	actions: InsightActions,
	values: { name: string; description: string },
): Promise<Topic> {
	const name = values.name.trim();
	if (!name) throw new Error("Name is required.");
	const row = await callPixel(
		actions,
		pixel("BrainSaveTopic", {
			topic: {
				name,
				...(values.description.trim()
					? { description: values.description.trim() }
					: {}),
			},
		}),
		topicDetailSchema,
	);
	return mapTopic(row);
}

/** Read one topic without depending on the global directory's first page. */
export async function readTopic(
	actions: InsightActions,
	topicId: string,
): Promise<Topic> {
	const row = await callPixel(
		actions,
		pixel("BrainListTopics", { topicId }),
		topicDetailSchema,
	);
	if (row.id !== topicId)
		throw new Error("Received a different topic. Try again.");
	return mapTopic(row);
}

/** Read every related task, publishing validated pages while keeping partial coverage explicit. */
export async function readTopicItems(
	actions: InsightActions,
	topicId: string,
	onPage: (items: WorkItem[]) => void,
	isCancelled: () => boolean,
): Promise<WorkItem[]> {
	const rows = await readPages(
		actions,
		(offset) =>
			pixel("WorkListItems", {
				view: "all",
				topicId,
				sort: "priority",
				limit: PAGE_SIZE,
				offset,
			}),
		workItemSchema,
		(page) => {
			if (
				page.some(
					(item) =>
						item.linkTopicId !== topicId &&
						!item.topicIds.includes(topicId),
				)
			)
				throw new Error(
					"Tasks returned an unrelated topic. Try again.",
				);
			onPage(page.map(mapItem));
		},
		isCancelled,
	);
	return rows.map(mapItem);
}

async function readPages<Row extends { id: string }>(
	actions: InsightActions,
	statementAt: (offset: number) => string,
	rowSchema: z.ZodType<Row>,
	onPage: (rows: Row[]) => void,
	isCancelled: () => boolean,
): Promise<Row[]> {
	const schema = z.object({
		items: z.array(rowSchema),
		total: z.number().int().nonnegative(),
	});
	const rows = new Map<string, Row>();
	let expected: number | undefined;
	let offset = 0;
	for (let index = 0; index < MAX_PAGES; index += 1) {
		if (isCancelled()) throw new Error("Topic read was cancelled.");
		const page = await callPixel(actions, statementAt(offset), schema);
		if (isCancelled()) throw new Error("Topic read was cancelled.");
		expected ??= page.total;
		if (
			page.total !== expected ||
			(!page.items.length && offset < expected) ||
			offset + page.items.length > expected
		)
			throw new Error(
				"Topic data changed while loading. Refresh to try again.",
			);
		for (const row of page.items) {
			if (rows.has(row.id))
				throw new Error(
					"Topic data returned overlapping pages. Refresh to try again.",
				);
			rows.set(row.id, row);
		}
		onPage(page.items);
		offset += page.items.length;
		if (offset === expected) return [...rows.values()];
	}
	throw new Error("Some topic data remains unloaded. Refresh to try again.");
}
