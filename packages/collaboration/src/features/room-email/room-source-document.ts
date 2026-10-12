import { createEmptyWorkspace } from "@/features/collaboration/state/collaboration.reducer";
import { selectThreadContext } from "@/features/collaboration/state/collaboration.selectors";
import type {
	CollaborationState,
	Thread,
	WorkspaceMessage,
} from "@/features/collaboration/state/collaboration.types";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import type { SourceThreadDocument } from "@/features/rooms/source-import/load-source-thread";
import type { RoomSource } from "@/features/rooms/source-import/room-source";

/** Apply the same source rules and quoted-reply cleanup as the initial import. */
export function roomSourceDocument(
	source: RoomSource,
	messages: WorkspaceMessage[],
	state: CollaborationState | null,
): SourceThreadDocument {
	if (source.nativeId && state?.deletedSourceIds?.includes(source.nativeId))
		throw new Error("This source has been deleted.");
	const saved = state?.threads.find(
		(thread) => thread.id === source.threadId,
	);
	const participants = new Map(
		(saved?.participants ?? []).map((person) => [person.personId, person]),
	);
	for (const message of messages) {
		if (!participants.has(message.fromId))
			participants.set(message.fromId, {
				personId: message.fromId,
				name:
					message.fromName || message.fromAddress || "Unknown sender",
				email: message.fromAddress,
				role: "Sender",
				included: true,
			});
	}
	const thread: Thread = {
		id: source.threadId,
		channel: source.channel,
		subject: source.title,
		topicLinks: [],
		muted: false,
		messageCount: messages.length,
		lastAt: messages.at(-1)?.at ?? "",
		roomId: null,
		summary: "",
		isSample: false,
		...saved,
		participants: [...participants.values()],
	};
	const context = selectThreadContext(
		{
			threads: [thread],
			workspaces: {
				[source.threadId]: { ...createEmptyWorkspace(), messages },
			},
			rules: state?.rules ?? [],
			people: state?.people ?? [],
			topics: state?.topics ?? [],
			accounts: state?.accounts ?? [],
			liveProfile: state?.liveProfile,
		},
		source.threadId,
	);
	if (!context) throw new Error("This thread's source could not be read.");
	const originals = new Map(messages.map((message) => [message.id, message]));
	return {
		thread,
		kind: source.kind,
		messages: context.messages.map((message) => {
			const original = originals.get(message.id);
			return {
				...message,
				to: original?.to,
				cc: original?.cc,
				webLink: safeSourceUrl(original?.webLink),
			};
		}),
		limitations: context.hiddenCount
			? ["Messages excluded from assistant context are not included."]
			: [],
	};
}
