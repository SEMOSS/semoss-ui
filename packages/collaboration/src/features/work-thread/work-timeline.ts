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

/**
 * Slot source emails into the assistant conversation by time, without ever
 * re-sorting the conversation itself. The session already orders it, and its
 * saved and live messages carry server and browser clocks; sorting by those
 * moved a just-sent request around while its answer streamed.
 */
export function workTimeline(
	sources: WorkspaceMessage[],
	conversation: ConversationMessage[],
	roomId: string,
	tools: Record<string, ConversationTool> = {},
): WorkTimelineEntry[] {
	const identity = (message: ConversationMessage): MessageIdentity =>
		`assistant:${roomId}:${message.id.replace(/^agent-final:/, "agent-run:")}`;
	const time = (at?: string) => {
		const value = Date.parse(at ?? "");
		return Number.isFinite(value) ? value : null;
	};
	const pending = sources
		.map((message, order) => ({
			message,
			order,
			at: time(message.at) ?? 0,
		}))
		.sort((a, b) => a.at - b.at || a.order - b.order);
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
	// An email sent before (or with) a timestamped message goes ahead of it.
	const addSources = (until: number) => {
		while (pending.length && pending[0].at <= until) {
			const source = pending.shift();
			if (!source) break;
			flush();
			const id: MessageIdentity = `source:${source.message.id}`;
			entries.push({
				kind: "source",
				id,
				ids: [id],
				message: source.message,
			});
		}
	};
	for (const message of presentThreadMessages(conversation).map(
		presentThreadInsights,
	)) {
		if (message.visible === false) continue;
		// A message with no time yet is still streaming, so it is happening now.
		addSources(time(message.createdAt) ?? Date.now());
		batch.push(message);
	}
	flush();
	addSources(Number.POSITIVE_INFINITY);
	return entries;
}
