import type { AgentTurnSnapshot } from "@/features/rooms/api/agent-turn-controller";

/** An ordinary idle room turn, independent of the removed source-thread session. */
export function idleEmailTurn(): AgentTurnSnapshot {
	return {
		messages: [],
		toolStates: {},
		pendingApprovals: [],
		phase: null,
		isSubmitting: false,
		isRestoring: false,
		isCancelling: false,
		isRunning: false,
		turnError: null,
		transportError: null,
		settlementVersion: 0,
	};
}
