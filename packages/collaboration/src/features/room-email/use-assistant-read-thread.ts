import { useEffect, useRef } from "react";
import { asString } from "@semoss/utility/string";
import type { ConversationMessage } from "@/features/messages/types/message";
import type { AgentTurnSnapshot } from "@/features/rooms/api/agent-turn-controller";
import {
	getToolComponent,
	TOOL_COMPONENTS,
} from "@/features/tools/utils/tool-components";

/**
 * The thread the last ReadThread read since the owner's latest message. An
 * email the assistant wrote after it wins, since its draft opens instead.
 */
export function lastReadThreadId(
	messages: ConversationMessage[],
): string | undefined {
	const lastUser = messages.reduce(
		(last, message, index) => (message.role === "user" ? index : last),
		-1,
	);
	let threadId: string | undefined;
	for (const message of messages.slice(lastUser + 1)) {
		if (message.visible === false) continue;
		for (const part of message.parts) {
			if (
				part.type !== "tool" ||
				part.tool.status !== "COMPLETED" ||
				part.tool.error
			)
				continue;
			if (getToolComponent(part.tool) === TOOL_COMPONENTS.emailCompose)
				threadId = undefined;
			else if (part.tool.name === "ReadThread")
				threadId =
					asString(part.tool.arguments.threadId).trim() || threadId;
		}
	}
	return threadId;
}

/**
 * Show the thread the assistant read once a run that started here completes.
 * Restored history, failed runs, and the room's own source thread open nothing.
 */
export function useAssistantReadThread({
	turn,
	isReady,
	sourceThreadId,
	onOpen,
}: {
	turn: AgentTurnSnapshot;
	isReady: boolean;
	/** Already shown by the room's source reader. */
	sourceThreadId?: string;
	onOpen: (threadId: string) => void;
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
		const threadId = lastReadThreadId(turn.messages);
		if (threadId && threadId !== sourceThreadId)
			onOpenRef.current(threadId);
	}, [isReady, sourceThreadId, turn]);
}
