import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
	ConversationMessage,
	ConversationTool,
} from "@/features/messages/types/message";
import {
	type AgentRun,
	isTerminalRun,
	readRun,
} from "@/features/rooms/api/agent-run-api";

const TOOL_NAME = "DelegateToPerson";
const POLL_MS = 10_000;

interface DelegationRef {
	runId: string;
	assignee: string;
}

/** The tool result names the child run and who it went to. */
function delegationRef(tool: ConversationTool): DelegationRef | null {
	if (tool.name !== TOOL_NAME || !tool.output) return null;
	try {
		const parsed = JSON.parse(tool.output) as Record<string, unknown>;
		return typeof parsed.runId === "string"
			? {
					runId: parsed.runId,
					assignee:
						typeof parsed.assignee === "string"
							? parsed.assignee
							: "them",
				}
			: null;
	} catch {
		return null;
	}
}

function delegationTool(
	tool: ConversationTool,
	who: string,
	run: AgentRun | undefined,
): ConversationTool {
	if (!run || run.status === "INPUT_REQUIRED" || !isTerminalRun(run))
		return {
			...tool,
			title: `Waiting on ${who}`,
			status: "INPUT_REQUIRED",
			statusLabel: "Waiting for response",
		};
	if (run.status === "COMPLETED")
		return {
			...tool,
			title: `${who} responded`,
			statusLabel: "Response received",
		};
	const declined = run.errorMessage?.startsWith("Declined");
	return {
		...tool,
		title: declined ? `${who} declined` : `Request to ${who}`,
		status: "CANCELLED",
		statusLabel: declined
			? "Declined"
			: run.status === "CANCELLED"
				? "Withdrawn"
				: "Not answered",
	};
}

/**
 * Keeps each DelegateToPerson card showing its person's progress. Nothing
 * streams while they work, so pending requests are polled; `onAnswered` runs
 * when one settles so the room can load the delivered result.
 */
export function useDelegationStatus(
	insightId: string,
	thread: ConversationMessage[],
	onAnswered: () => void,
) {
	const [runs, setRuns] = useState<Record<string, AgentRun>>({});
	const answered = useRef(onAnswered);
	answered.current = onAnswered;

	const refs = useMemo(() => {
		const found = new Map<string, DelegationRef>();
		for (const message of thread)
			for (const part of message.parts)
				if (part.type === "tool") {
					const ref = delegationRef(part.tool);
					if (ref) found.set(ref.runId, ref);
				}
		return [...found.values()];
	}, [thread]);
	const runIds = refs.map((ref) => ref.runId).join(",");

	useEffect(() => {
		if (!runIds) return;
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const seen: Record<string, AgentRun> = {};
		const poll = async () => {
			const ids = runIds
				.split(",")
				.filter((id) => !seen[id] || !isTerminalRun(seen[id]));
			let settled = false;
			for (const id of ids) {
				try {
					const run = await readRun(insightId, id, false);
					if (
						seen[id] &&
						!isTerminalRun(seen[id]) &&
						isTerminalRun(run)
					)
						settled = true;
					seen[id] = run;
				} catch {
					// A transient read failure keeps the last known state.
				}
			}
			if (cancelled) return;
			setRuns({ ...seen });
			if (settled) answered.current();
			if (Object.values(seen).some((run) => !isTerminalRun(run)))
				timer = setTimeout(() => void poll(), POLL_MS);
		};
		void poll();
		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
		};
	}, [insightId, runIds]);

	return useCallback(
		(messages: ConversationMessage[]): ConversationMessage[] =>
			refs.length === 0
				? messages
				: messages.map((message) => ({
						...message,
						parts: message.parts.map((part) => {
							if (part.type !== "tool") return part;
							const ref = delegationRef(part.tool);
							return ref
								? {
										...part,
										tool: delegationTool(
											part.tool,
											ref.assignee,
											runs[ref.runId],
										),
									}
								: part;
						}),
					})),
		[refs, runs],
	);
}
