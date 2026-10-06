import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import type { SearchEntry } from "./collaboration-search";

/** Three interleaved result types, enough matches to exercise a second page. */
export const searchEntries: SearchEntry[] = Array.from(
	{ length: 45 },
	(_, index) => {
		const kind = (["topic", "person", "thread"] as const)[index % 3];
		return {
			kind,
			id: `saved-${kind}-${index}`,
			name: `SearchCase ${String(index).padStart(2, "0")}`,
		};
	},
);

/** A fresh session with no records, as if every result lay outside its startup batches. */
export function emptySearchSession() {
	return {
		...createInitialCollaborationState(),
		topics: [],
		people: [],
		threads: [],
		items: [],
		reviews: [],
		workspaces: {},
		openThreadIds: [],
	};
}

/** Server detail payloads, including a thread's native identity and saved goal. */
export function searchRecordFixture(entry: SearchEntry) {
	return {
		items: [],
		topics:
			entry.kind === "topic"
				? [
						{
							id: entry.id,
							name: entry.name,
							status: "active",
							kind: "internal",
							people: [],
							goals: [],
							notes: [],
							stats: {},
						},
					]
				: [],
		people:
			entry.kind === "person"
				? [
						{
							id: entry.id,
							name: entry.name,
							email: "test@search.example",
							channels: {},
							topics: [],
						},
					]
				: [],
		threads:
			entry.kind === "thread"
				? [
						{
							id: entry.id,
							subject: entry.name,
							channel: "email",
							participants: [],
							topicLinks: [],
							latestMessageId: "fixture-native-message",
							conversationId: "fixture-conversation",
						},
					]
				: [],
		workspaces: {
			items:
				entry.kind === "thread"
					? [
							{
								threadId: entry.id,
								goal: "Saved search fixture goal",
								steps: [],
								facts: [],
							},
						]
					: [],
			total: entry.kind === "thread" ? 1 : 0,
		},
	};
}
