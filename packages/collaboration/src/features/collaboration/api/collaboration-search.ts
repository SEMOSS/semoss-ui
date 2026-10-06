import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	mapItem,
	mapPerson,
	mapThread,
	mapTopic,
	mapWorkspaces,
} from "../live/live-state";
import { createEmptyWorkspace } from "../state/collaboration.reducer";
import type { CollaborationCommand } from "../state/collaboration.types";

const searchKindSchema = z.enum(["thread", "person", "topic"]);
const searchEntrySchema = z.object({
	kind: searchKindSchema,
	id: z.string().min(1),
	name: z.string(),
	detail: z.string().nullable().optional(),
});
const searchPageSchema = z.object({
	items: z.array(searchEntrySchema),
	total: z.number().int().nonnegative(),
});
export type SearchKind = z.infer<typeof searchKindSchema>;
export type SearchEntry = z.infer<typeof searchEntrySchema>;
export type SearchPage = z.infer<typeof searchPageSchema>;
export const SEARCH_PAGE_SIZE = 30;

/** Searches all saved metadata; the server determines record access. */
export async function searchCollaboration(
	actions: InsightActions,
	query: string,
	offset = 0,
): Promise<SearchPage> {
	return callPixel(
		actions,
		pixel("SearchCollaboration", {
			query: query.trim(),
			limit: SEARCH_PAGE_SIZE,
			offset,
		}),
		searchPageSchema,
	);
}

/** Produces encoded in-app paths rather than accepting URLs from server data. */
export function searchResultPath(
	entry: Pick<SearchEntry, "kind" | "id">,
): string {
	const roots = {
		thread: "/work/thread/",
		person: "/brain/people/",
		topic: "/brain/topics/",
	};
	return roots[entry.kind] + encodeURIComponent(entry.id);
}

const rowSchema = z.object({ id: z.string().min(1) }).passthrough();
const recordSchema = z.object({
	topics: z.array(rowSchema),
	people: z.array(rowSchema),
	threads: z.array(rowSchema),
	items: z.array(rowSchema),
	workspaces: z.object({
		items: z.array(z.object({ threadId: z.string().min(1) }).passthrough()),
		total: z.number().int().nonnegative(),
	}),
});

/** Fetches the missing detail and maps it into a session-only hydration command. */
export async function loadSearchRecord(
	actions: InsightActions,
	kind: SearchKind,
	id: string,
): Promise<CollaborationCommand> {
	const result = await callPixel(
		actions,
		pixel("BrainGetSearchRecord", { kind, id }),
		recordSchema,
	);
	const rows =
		kind === "thread"
			? result.threads
			: kind === "person"
				? result.people
				: result.topics;
	if (!rows.some((row) => row.id === id))
		throw new Error("The requested record was not returned.");
	const threads = result.threads.map(mapThread);
	return {
		type: "records.loaded",
		topics: result.topics.map(mapTopic),
		people: result.people.map(mapPerson),
		threads,
		items: result.items.map(mapItem),
		workspaces: {
			...Object.fromEntries(
				threads.map((thread) => [thread.id, createEmptyWorkspace()]),
			),
			...mapWorkspaces(result.workspaces),
		},
	};
}
