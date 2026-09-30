import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import type {
	ConversationMessage,
	ConversationTool,
} from "@/features/messages/types/message";
import {
	type MessagePresentation,
	presentMessages,
} from "@/features/messages/utils/message-presentation";
import { presentThreadMessages } from "@/features/thread-assistant/thread-context";
import { presentDraftProposal } from "@/features/thread-assistant/thread-draft-proposal";
import { presentThreadInsights } from "./thread-insights";

type MessageIdentity = `source:${string}` | `assistant:${string}:${string}`;

export type WorkTimelineEntry =
	| {
			kind: "source";
			id: MessageIdentity;
			ids: MessageIdentity[];
			message: WorkspaceMessage;
	  }
	| {
			kind: "assistant";
			id: MessageIdentity;
			ids: MessageIdentity[];
			presentation: MessagePresentation;
	  };

/** Adjacent source or assistant entries share a section, never crossing the other kind. */
export interface WorkTimelineGroup {
	id: string;
	kind: WorkTimelineEntry["kind"];
	entries: WorkTimelineEntry[];
}

/** Keep chronological boundaries while giving appended entries a stable section owner. */
export function groupWorkTimeline(
	entries: readonly WorkTimelineEntry[],
): WorkTimelineGroup[] {
	const groups: WorkTimelineGroup[] = [];
	for (const entry of entries) {
		const previous = groups.at(-1);
		if (previous?.kind === entry.kind) previous.entries.push(entry);
		else groups.push({ id: entry.id, kind: entry.kind, entries: [entry] });
	}
	return groups;
}

/** Merge before grouping so an intervening source reply never moves around assistant activity. */
export function workTimeline(
	sources: WorkspaceMessage[],
	conversation: ConversationMessage[],
	roomId: string,
	tools: Record<string, ConversationTool> = {},
	firstSeen: ReadonlyMap<string, string> = new Map(),
): WorkTimelineEntry[] {
	const identity = (message: ConversationMessage): MessageIdentity =>
		`assistant:${roomId}:${message.id.replace(/^agent-final:/, "agent-run:")}`;
	type Item = { at: number; order: number } & (
		| { kind: "source"; message: WorkspaceMessage; id: MessageIdentity }
		| {
				kind: "assistant";
				message: ConversationMessage;
				id: MessageIdentity;
		  }
	);
	const items: Item[] = [];
	const time = (at?: string) => {
		const value = Date.parse(at ?? "");
		return Number.isFinite(value) ? value : 0;
	};
	for (const message of sources)
		items.push({
			kind: "source",
			message,
			id: `source:${message.id}`,
			at: time(message.at),
			order: items.length,
		});
	for (const message of presentThreadMessages(conversation)
		.map(presentDraftProposal)
		.map(presentThreadInsights))
		if (message.visible !== false)
			items.push({
				kind: "assistant",
				message,
				id: identity(message),
				at: time(
					message.createdAt ??
						firstSeen.get(message.id) ??
						new Date().toISOString(),
				),
				order: items.length,
			});
	items.sort((a, b) => a.at - b.at || a.order - b.order);
	const entries: WorkTimelineEntry[] = [];
	let batch: ConversationMessage[] = [];
	const flush = () => {
		for (const presentation of presentMessages(batch, tools)) {
			const ids = new Set<MessageIdentity>([
				identity(presentation.message),
			]);
			for (const part of presentation.parts)
				ids.add(identity(part.message));
			entries.push({
				kind: "assistant",
				id: identity(presentation.message),
				ids: [...ids],
				presentation,
			});
		}
		batch = [];
	};
	for (const item of items) {
		if (item.kind === "assistant") {
			batch.push(item.message);
		} else {
			flush();
			entries.push({
				kind: "source",
				id: item.id,
				ids: [item.id],
				message: item.message,
			});
		}
	}
	flush();
	return entries;
}
