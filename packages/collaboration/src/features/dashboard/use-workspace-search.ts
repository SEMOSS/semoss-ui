import { useEffect, useState } from "react";
import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import { listMail } from "@/features/connectors/api/microsoft";
import type { OutlookMail } from "@/features/connectors/api/microsoft-schemas";
import type { MailSearchFilters } from "@/features/connectors/types";
import { listRoomsPage } from "@/features/rooms/api/list-rooms";
import { searchRoomMessages } from "@/features/rooms/api/search-room-messages";
import type { InsightActions } from "@/lib/pixel";
import { roomPath, threadPath } from "@/lib/workspace-paths";

export interface WorkspaceSearchResult {
	id: string;
	label: string;
	detail: string;
	group:
		| "Chats"
		| "Actions"
		| "People"
		| "Topics"
		| "Calendar"
		| "Email"
		| "Apps"
		| "Go to";
	path?: string;
	roomId?: string;
	source?: { kind: "email" | "calendar"; id: string };
	appId?: string;
	/** Source-less tasks retain a detail action without a fabricated route. */
	taskId?: string;
}

/** Local records are searchable immediately, without loading message bodies. */
export function searchWorkspaceRecords(
	state: CollaborationState,
	query: string,
): WorkspaceSearchResult[] {
	const term = query.trim().toLocaleLowerCase();
	if (!term) return [];
	return [
		...state.items
			.filter(
				(item) => item.status === "open" || item.status === "waiting",
			)
			.map(
				(item): WorkspaceSearchResult => ({
					id: `action:${item.id}`,
					label: item.title,
					detail: item.priority || "Action",
					group: "Actions",
					path: item.roomId
						? roomPath(item.roomId)
						: item.threadId
							? threadPath(item.threadId)
							: undefined,
					taskId: item.id,
				}),
			),
		...state.people.map(
			(person): WorkspaceSearchResult => ({
				id: `person:${person.id}`,
				label: person.name,
				detail: person.email || "Person",
				group: "People",
				path: `/brain/people/${encodeURIComponent(person.id)}`,
			}),
		),
		...state.topics.map(
			(topic): WorkspaceSearchResult => ({
				id: `topic:${topic.id}`,
				label: topic.name,
				detail: topic.description || "Topic",
				group: "Topics",
				path: `/tasks/topic/${encodeURIComponent(topic.id)}`,
			}),
		),
		...state.threads.map(
			(thread): WorkspaceSearchResult => ({
				id: `thread:${thread.id}`,
				label: thread.subject,
				detail: thread.summary || "Connected conversation",
				group: thread.channel === "email" ? "Email" : "Chats",
				path: threadPath(thread.id),
			}),
		),
	].filter((entry) =>
		`${entry.label} ${entry.detail}`.toLocaleLowerCase().includes(term),
	);
}

interface RemoteSearch {
	key: string;
	chats: WorkspaceSearchResult[];
	mail: OutlookMail[];
	errors: string[];
	isLoading: boolean;
	hasMore: boolean;
}
interface SearchPart {
	chats: WorkspaceSearchResult[];
	mail: OutlookMail[];
	hasMore: boolean;
	error: string;
}
const labels = ["Chat names", "Chat content", "Email subject", "Email sender"];
const emptyPart = (): SearchPart => ({
	chats: [],
	mail: [],
	hasMore: false,
	error: "",
});

/** Independent providers retain their last successful results when another category fails. */
export function useWorkspaceSearch(
	actions: InsightActions | null,
	query: string,
	enabled: boolean,
	includeMail: boolean,
	days: MailSearchFilters["sinceDays"],
): RemoteSearch & { more: () => void; retry: () => void } {
	const [page, setPage] = useState({ key: "", number: 0 });
	const [revision, setRevision] = useState(0);
	const key = `${query.trim()}:${days}`;
	const pageNumber = page.key === key ? page.number : 0;
	const [state, setState] = useState<{
		key: string;
		parts: SearchPart[];
		isLoading: boolean;
	}>({ key: "", parts: [], isLoading: false });
	useEffect(() => {
		void revision;
		if (!actions || !enabled || query.trim().length < 2) return;
		let cancelled = false;
		const timer = window.setTimeout(() => {
			setState((current) => ({
				key,
				parts: current.key === key ? current.parts : [],
				isLoading: true,
			}));
			const reads = [
				listRoomsPage(actions, pageNumber * 25, query),
				searchRoomMessages(actions, query, pageNumber * 50),
				...(includeMail
					? [
							listMail(actions, {
								sinceDays: days,
								subject: query,
							}),
							listMail(actions, { sinceDays: days, from: query }),
						]
					: []),
			];
			void Promise.allSettled(reads).then((results) => {
				if (cancelled) return;
				setState((current) => ({
					key,
					isLoading: false,
					parts: results.map((result, index): SearchPart => {
						const prior =
							current.key === key
								? (current.parts[index] ?? emptyPart())
								: emptyPart();
						if (result.status === "rejected")
							return {
								...prior,
								error: `${labels[index]}: ${result.reason instanceof Error ? result.reason.message : "unavailable"}`,
							};
						const value = result.value;
						let chats: WorkspaceSearchResult[] = [];
						let mail: OutlookMail[] = [];
						let hasMore = false;
						if (Array.isArray(value)) {
							hasMore = value.length === 50;
							chats = value.map((row) => ({
								id: `room:${row.roomId}`,
								label: row.roomName,
								detail: "Message match",
								group: "Chats",
								roomId: row.roomId,
							}));
						} else if ("rooms" in value) {
							hasMore = value.hasMore;
							chats = value.rooms.map((row) => ({
								id: `room:${row.roomId}`,
								label: row.roomName || "Untitled chat",
								detail: "Chat",
								group: "Chats",
								roomId: row.roomId,
							}));
						} else mail = value.messages;
						return {
							chats: [
								...new Map(
									[
										...(pageNumber > 0 ? prior.chats : []),
										...chats,
									].map((row) => [row.id, row]),
								).values(),
							],
							mail,
							hasMore,
							error: "",
						};
					}),
				}));
			});
		}, 300);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [actions, query, enabled, includeMail, days, key, pageNumber, revision]);
	const parts = state.key === key ? state.parts : [];
	return {
		key,
		chats: [
			...new Map(
				parts.flatMap((part) => part.chats).map((row) => [row.id, row]),
			).values(),
		],
		mail: [
			...new Map(
				parts.flatMap((part) => part.mail).map((row) => [row.uid, row]),
			).values(),
		],
		errors: parts.map((part) => part.error).filter(Boolean),
		isLoading:
			state.key === key
				? state.isLoading
				: Boolean(actions && enabled && query.trim().length >= 2),
		hasMore: parts.some((part) => part.hasMore),
		more: () => setPage({ key, number: pageNumber + 1 }),
		retry: () => setRevision((value) => value + 1),
	};
}
