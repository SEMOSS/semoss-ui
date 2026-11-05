import { useEffect, useRef } from "react";
import type { ConversationMessage } from "@/features/messages/types/message";
import type { AgentTurnSnapshot } from "@/features/rooms/api/agent-turn-controller";
import { type ShownItem, shownItem } from "@/features/tools/utils/shown-item";
import {
	getToolComponent,
	TOOL_COMPONENTS,
} from "@/features/tools/utils/tool-components";

/**
 * What the latest turn opens: what ShowItem showed since the owner's latest
 * message, else the one thread ReadThread read. Two threads read open nothing,
 * since the turn did not single one out, and an email written after them wins,
 * since its draft opens instead. The room's own thread is already on screen.
 */
export function itemsToShow(
	messages: ConversationMessage[],
	roomId?: string,
	sourceThreadId?: string,
): ShownItem[] {
	const lastUser = messages.reduce(
		(last, message, index) => (message.role === "user" ? index : last),
		-1,
	);
	let shown: ShownItem[] = [];
	const read = new Map<string, ShownItem>();
	for (const message of messages.slice(lastUser + 1)) {
		if (message.visible === false) continue;
		for (const part of message.parts) {
			if (part.type !== "tool") continue;
			const { tool } = part;
			if (
				tool.status === "COMPLETED" &&
				!tool.error &&
				getToolComponent(tool) === TOOL_COMPONENTS.emailCompose
			) {
				shown = [];
				read.clear();
				continue;
			}
			const item = shownItem(tool, roomId);
			if (tool.name === "ShowItem" && item) shown.push(item);
			else if (tool.name === "ReadThread" && item?.kind === "thread")
				read.set(item.threadId, item);
		}
	}
	if (shown.length) return shown;
	const [only] = read.values();
	return read.size === 1 &&
		only?.kind === "thread" &&
		only.threadId !== sourceThreadId
		? [only]
		: [];
}

/**
 * Show what the assistant found once a run that started here completes.
 * Restored history and failed runs open nothing.
 */
export function useAssistantShownItems({
	turn,
	isReady,
	roomId,
	sourceThreadId,
	onOpen,
}: {
	turn: AgentTurnSnapshot;
	isReady: boolean;
	roomId: string;
	/** Already shown by the room's source reader. */
	sourceThreadId?: string;
	onOpen: (item: ShownItem) => void;
}): void {
	const onOpenRef = useRef(onOpen);
	onOpenRef.current = onOpen;
	const observedRun = useRef(false);
	const baseline = useRef<number | null>(null);
	useEffect(() => {
		if (!isReady) return;
		if (baseline.current === null)
			baseline.current = turn.settlementVersion;
		const isRunning = turn.isRunning || turn.isSubmitting;
		const isNewCompletion =
			!isRunning &&
			observedRun.current &&
			turn.phase === "completed" &&
			turn.settlementVersion > baseline.current;
		observedRun.current = isRunning;
		baseline.current = turn.settlementVersion;
		if (!isNewCompletion) return;
		// shortcut: items open when the whole run completes, so a run paused on an approval opens nothing until it ends; open each ShowItem as it completes if that wait matters
		for (const item of itemsToShow(turn.messages, roomId, sourceThreadId))
			onOpenRef.current(item);
	}, [isReady, roomId, sourceThreadId, turn]);
}
