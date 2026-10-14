import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { createEmptyWorkspace } from "@/features/collaboration/state/collaboration.reducer";
import type {
	CollaborationState,
	Thread,
	WorkspaceMessage,
} from "@/features/collaboration/state/collaboration.types";
import type { SourceThreadDocument } from "./load-source-thread";

/** Real-source fixture independent of the sample scenario's contents. */
export function sourceImportState(): CollaborationState {
	const state = createInitialCollaborationState();
	const thread: Thread = {
		id: "source-one",
		channel: "email",
		subject: "Budget review",
		topicLinks: [],
		participants: [
			{ personId: "sender", name: "Ada", role: "Sender", included: true },
		],
		muted: false,
		messageCount: 1,
		lastAt: "2026-10-01T12:00:00Z",
		roomId: null,
		summary: "",
		isSample: false,
		source: { kind: "outlook", nativeId: "mail-one" },
	};
	return {
		...state,
		threads: [thread],
		people: [],
		rules: [],
		workspaces: { [thread.id]: createEmptyWorkspace() },
	};
}

/** One readable message from the allowed participant. */
export function sourceMessage(
	id = "mail-one",
	text = "Review the budget.",
): WorkspaceMessage {
	return {
		id,
		fromId: "sender",
		fromName: "Ada",
		fromAddress: "ada@example.com",
		at: "2026-10-01T12:00:00Z",
		text,
	};
}

/** Complete serializable source document for transaction tests. */
export function sourceDocument(): SourceThreadDocument {
	const thread = sourceImportState().threads[0];
	if (!thread) throw new Error("Missing source fixture.");
	return {
		thread,
		kind: "brain",
		messages: [{ ...sourceMessage(), attachments: [] }],
		limitations: [],
	};
}
