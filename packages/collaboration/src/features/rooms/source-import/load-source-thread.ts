import { importSourceCommand } from "@/features/collaboration/import-source";
import { readThreadMessagesPage } from "@/features/collaboration/live/live-state";
import { createEmptyWorkspace } from "@/features/collaboration/state/collaboration.reducer";
import { selectThreadContext } from "@/features/collaboration/state/collaboration.selectors";
import type {
	CollaborationState,
	ContextMessage,
	Thread,
	WorkspaceMessage,
} from "@/features/collaboration/state/collaboration.types";
import {
	getTeamsMessages,
	safeSourceUrl,
} from "@/features/connectors/api/microsoft";
import { importTeamsChat } from "@/features/connectors/api/source-mapping";
import type { ImportedSource } from "@/features/connectors/types";
import { restoreSourceThread } from "@/features/dashboard/restore-source-thread";
import type { InsightActions } from "@/lib/pixel";
import type { RoomSource } from "./room-source";

/** Permitted source text and readable metadata ready to become one room file. */
export interface SourceThreadDocument {
	thread: Thread;
	kind: RoomSource["kind"];
	messages: (ContextMessage & {
		to?: string[];
		cc?: string[];
		webLink?: string;
	})[];
	limitations: string[];
}

/** Refresh imported data while preserving the owner's current source rules. */
function withImportedSource(
	state: CollaborationState,
	source: ImportedSource,
): CollaborationState {
	const imported = importSourceCommand(source);
	const previous = state.threads.find(
		(thread) => thread.id === imported.thread.id,
	);
	const thread: Thread = {
		...imported.thread,
		...(previous && {
			topicLinks: previous.topicLinks,
			muted: previous.muted,
		}),
		participants: imported.thread.participants.map((participant) => ({
			...participant,
			...previous?.participants.find(
				(current) => current.personId === participant.personId,
			),
		})),
	};
	const people = imported.people.map((person) => ({
		...person,
		...state.people.find((current) => current.id === person.id),
	}));
	return {
		...state,
		threads: [
			...state.threads.filter((current) => current.id !== thread.id),
			thread,
		],
		people: [
			...state.people.filter(
				(current) => !people.some((person) => person.id === current.id),
			),
			...people,
		],
		workspaces: {
			...state.workspaces,
			[thread.id]: {
				...createEmptyWorkspace(),
				...state.workspaces[thread.id],
				...imported.workspace,
				messages: (imported.workspace?.messages ?? []).map(
					(message) => ({
						...message,
						...(source.sourceKind === "outlook" && {
							to: source.participants
								.filter((person) => person.role === "to")
								.flatMap((person) =>
									person.address ? [person.address] : [],
								),
							cc: source.participants
								.filter((person) => person.role === "cc")
								.flatMap((person) =>
									person.address ? [person.address] : [],
								),
							attachments: source.attachments,
						}),
					}),
				),
			},
		},
	};
}

/** Read every available Brain page, or refresh one explicitly connected source. */
export async function loadSourceThread(
	actions: InsightActions,
	getState: () => CollaborationState,
	threadId: string,
	assertActive: () => void = () => undefined,
): Promise<SourceThreadDocument> {
	assertActive();
	let state = getState();
	let thread = state.threads.find((current) => current.id === threadId);
	const limitations: string[] = [];
	let kind: RoomSource["kind"] = thread?.isSample ? "sample" : "brain";
	if (threadId.startsWith("connected:")) {
		let source: ImportedSource | null;
		if (threadId.startsWith("connected:teams:")) {
			const nativeId = threadId.slice("connected:teams:".length);
			const page = await getTeamsMessages(actions, nativeId);
			source = importTeamsChat(
				{ id: nativeId, displayName: thread?.subject, members: [] },
				page,
			);
			limitations.push(
				"This snapshot contains the latest available Teams messages (up to 30); older chat history is not included.",
			);
		} else {
			source = await restoreSourceThread(actions, threadId);
		}
		assertActive();
		if (!source)
			throw new Error(
				"This source cannot be loaded. Open it from Sources again.",
			);
		state = withImportedSource(getState(), source);
		thread = state.threads.find((current) => current.id === threadId);
		kind = source.sourceKind;
	} else if (thread && !thread.isSample) {
		const messages = new Map<string, WorkspaceMessage>();
		const cursors = new Set<string>();
		let cursor: string | undefined;
		let hiddenCount = 0;
		let unavailableCount = 0;
		do {
			const page = await readThreadMessagesPage(
				actions,
				threadId,
				cursor,
			);
			assertActive();
			for (const message of page.messages) {
				if (!message.id)
					throw new Error(
						"The thread returned a message without an identity.",
					);
				if (!messages.has(message.id))
					messages.set(message.id, message);
			}
			hiddenCount = Math.max(hiddenCount, page.hiddenCount);
			unavailableCount += page.unavailableCount;
			if (!page.hasMore) break;
			if (!page.nextCursor || cursors.has(page.nextCursor)) {
				throw new Error(
					"The server could not continue this thread's history. Try opening it again.",
				);
			}
			cursors.add(page.nextCursor);
			cursor = page.nextCursor;
		} while (cursor);
		state = getState();
		thread = state.threads.find((current) => current.id === threadId);
		state = {
			...state,
			workspaces: {
				...state.workspaces,
				[threadId]: {
					...createEmptyWorkspace(),
					...state.workspaces[threadId],
					messages: [...messages.values()],
				},
			},
		};
		if (hiddenCount)
			limitations.push(
				"Some source messages are omitted by ingestion rules.",
			);
		if (unavailableCount)
			limitations.push(
				`${unavailableCount} source messages could not be read and are not included.`,
			);
		if (
			thread &&
			messages.size + hiddenCount + unavailableCount < thread.messageCount
		) {
			limitations.push(
				"The source reports additional messages, but the server returned no further history. This snapshot includes only the available messages.",
			);
		}
	}
	if (!thread || threadId.startsWith("session:")) {
		throw new Error(
			"This source thread is not loaded. Return to Work and open it again.",
		);
	}
	if (
		thread.source &&
		state.deletedSourceIds?.includes(thread.source.nativeId)
	) {
		throw new Error("This source has been deleted.");
	}
	const context = selectThreadContext(state, threadId);
	if (!context) throw new Error("This thread's source could not be read.");
	if (context.hiddenCount)
		limitations.push(
			"Messages excluded from assistant context are not included.",
		);
	const sourceMessages = new Map(
		state.workspaces[threadId]?.messages.map((message) => [
			message.id,
			message,
		]),
	);
	const people = new Map(state.people.map((person) => [person.id, person]));
	const messages = context.messages
		.map((message) => {
			const original = sourceMessages.get(message.id);
			const person = people.get(message.fromId);
			return {
				...message,
				fromName: message.fromName || person?.name,
				fromAddress: message.fromAddress || person?.email || undefined,
				to: original?.to,
				cc: original?.cc,
				webLink: safeSourceUrl(original?.webLink),
			};
		})
		.sort(
			(left, right) =>
				left.at.localeCompare(right.at) ||
				left.id.localeCompare(right.id),
		);
	return { thread, kind, messages, limitations };
}
