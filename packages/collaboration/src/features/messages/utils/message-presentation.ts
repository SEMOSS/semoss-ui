import { getToolDisplayLocation } from "@/features/tools/utils/tool-metadata";
import type {
	ConversationMessage,
	ConversationMessagePart,
	ConversationTool,
} from "../types/message";
import { messageCalendarDay } from "./message-metadata";

/** A rendered part keeps the identity and metadata of its original message. */
export interface OwnedMessagePart {
	key: string;
	part: ConversationMessagePart;
	message: ConversationMessage;
}

/** Consecutive assistant messages share a shell without changing their owners. */
export interface MessagePresentation {
	message: ConversationMessage;
	parts: OwnedMessagePart[];
	/** First valid source timestamp, independent of the stable response identity. */
	createdAt?: string;
	day?: string;
	dateSeparator?: string;
}

/** Filter empty placeholders without changing the authoritative transcript. */
export function messageHasVisiblePart(part: ConversationMessagePart): boolean {
	if (part.type === "text" || part.type === "thinking")
		return part.text.trim().length > 0;
	if (part.type === "tool") {
		return (
			getToolDisplayLocation(part.tool) !== "hidden" ||
			part.tool.status === "INPUT_REQUIRED"
		);
	}
	return true;
}

/** Source keys survive inserting earlier parts and folding later tool messages. */
export function ownedMessageParts(
	message: ConversationMessage,
	tools: Record<string, ConversationTool> = {},
): OwnedMessagePart[] {
	return message.parts.flatMap((sourcePart, index) => {
		const part =
			sourcePart.type === "tool"
				? {
						...sourcePart,
						tool: tools[sourcePart.tool.id] ?? sourcePart.tool,
					}
				: sourcePart;
		return messageHasVisiblePart(part)
			? [
					{
						key:
							part.renderKey ??
							(part.type === "tool"
								? part.tool.id
								: part.type === "run"
									? part.run.runId
									: `${message.id}-${part.type}-${index}`),
						part,
						message,
					},
				]
			: [];
	});
}

/** Build visual responses while preserving part order and message ownership. */
export function presentMessages(
	messages: ConversationMessage[],
	tools: Record<string, ConversationTool> = {},
): MessagePresentation[] {
	const entries: MessagePresentation[] = [];
	let currentDay: string | undefined;
	let currentDate: string | undefined;
	let canContinue = false;
	for (const message of messages) {
		if (message.visible === false) continue;
		const parts = ownedMessageParts(message, tools);
		const isDelegation = !!(
			message.delegationReply || message.delegationRequest
		);
		const day = messageCalendarDay(message.createdAt);
		if (
			message.role === "user" ||
			isDelegation ||
			(day && currentDay && day !== currentDay)
		)
			canContinue = false;
		currentDay = day ?? currentDay;
		if (day) currentDate = message.createdAt;
		const previous = entries.at(-1);
		if (previous && canContinue) {
			previous.parts.push(...parts);
			previous.createdAt ??= day ? message.createdAt : undefined;
			previous.day ??= currentDay;
		} else {
			entries.push({
				message,
				parts,
				createdAt: day ? message.createdAt : undefined,
				day: currentDay,
				dateSeparator: currentDate,
			});
		}
		canContinue = message.role === "assistant" && !isDelegation;
	}
	// Keep empty sources in their response identity, but never render an empty
	// response. A later part can arrive without replacing that response's shell.
	const visible = entries.filter(
		({ message, parts }) =>
			parts.length > 0 ||
			message.delegationReply ||
			message.delegationRequest,
	);
	for (let index = 0; index < visible.length; index++) {
		const previous = visible[index - 1];
		if (!previous?.day || previous.day === visible[index].day) {
			visible[index].dateSeparator = undefined;
		}
	}
	return visible;
}

export type MessagePartBlock =
	| { type: "part"; key: string; item: OwnedMessagePart }
	| { type: "tools"; key: string; items: OwnedMessagePart[] };

/** Only adjacent tool parts share an activity section; prose never moves. */
export function messagePartBlocks(
	parts: OwnedMessagePart[],
): MessagePartBlock[] {
	const blocks: MessagePartBlock[] = [];
	for (const item of parts) {
		const previous = blocks.at(-1);
		if (item.part.type !== "tool") {
			blocks.push({ type: "part", key: item.key, item });
		} else if (previous?.type === "tools") {
			previous.items.push(item);
		} else {
			blocks.push({ type: "tools", key: item.key, items: [item] });
		}
	}
	return blocks;
}

/** Group finished neighbors, including failures, leaving inspected/actionable tools in place. */
export function completedToolGroups(
	items: OwnedMessagePart[],
	pinnedIds: ReadonlySet<string>,
): OwnedMessagePart[][] {
	const groups: OwnedMessagePart[][] = [];
	let current: OwnedMessagePart[] = [];
	const flush = (): void => {
		if (current.length > 1) groups.push(current);
		current = [];
	};
	for (const item of items) {
		if (
			item.part.type === "tool" &&
			(item.part.tool.status === "COMPLETED" ||
				item.part.tool.status === "FAILED") &&
			!pinnedIds.has(item.part.tool.id)
		) {
			current.push(item);
		} else flush();
	}
	flush();
	return groups;
}
