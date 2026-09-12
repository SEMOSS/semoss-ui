import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AgentRunItemsState, PendingAgentAction } from "@semoss/sdk";
import {
	type AutomationAgentRunContext,
	type AutomationAgentRunSnapshot,
	getAutomationAgentRun,
	resolveAutomationAgentRunAction,
	stopAutomationAgentRun,
} from "../api";
import type { AutomationAgentRunMessage } from "../components/agent-run/agent-run.types";
import { isTerminalAgentRunStatus } from "../components/agent-run/agent-run.utils";

const RECONCILE_INTERVAL_MS = 2000;

const EMPTY_ITEMS: AgentRunItemsState = {
	itemsById: {},
	itemOrder: [],
};

interface AgentRunCoordinatorState {
	snapshot: AutomationAgentRunSnapshot | null;
	messages: AutomationAgentRunMessage[];
	items: AgentRunItemsState;
	loading: boolean;
	loadError: string | null;
	liveError: string | null;
}

interface UseAgentRunCoordinatorOptions extends AutomationAgentRunContext {
	open: boolean;
}

const createEmptyState = (): AgentRunCoordinatorState => ({
	snapshot: null,
	messages: [],
	items: EMPTY_ITEMS,
	loading: false,
	loadError: null,
	liveError: null,
});

const errorMessage = (error: unknown, fallback: string): string =>
	error instanceof Error ? error.message : fallback;

/**
 * Polls the Automation-only durable agent-run endpoint. Generic agent streaming
 * and run APIs remain owner-scoped and are intentionally never used here.
 */
export function useAgentRunCoordinator({
	open,
	projectId,
	automationRunId,
	nodeId,
	agentRunId,
}: UseAgentRunCoordinatorOptions) {
	const [state, setState] =
		useState<AgentRunCoordinatorState>(createEmptyState);
	const requestIdRef = useRef(0);
	const context = useMemo(
		() => ({ projectId, automationRunId, nodeId, agentRunId }),
		[agentRunId, automationRunId, nodeId, projectId],
	);
	const connected =
		open &&
		Boolean(
			projectId.trim() &&
				automationRunId.trim() &&
				nodeId.trim() &&
				agentRunId.trim(),
		);

	const refresh = useCallback(async () => {
		if (!connected) return;
		const requestId = ++requestIdRef.current;
		setState((current) => ({
			...current,
			loading: current.snapshot === null,
			loadError: current.snapshot === null ? null : current.loadError,
		}));
		try {
			const snapshot = await getAutomationAgentRun(context);
			if (requestId !== requestIdRef.current) return;
			setState({
				snapshot,
				messages: Array.isArray(snapshot.messages)
					? snapshot.messages
					: [],
				items: EMPTY_ITEMS,
				loading: false,
				loadError: null,
				liveError: null,
			});
		} catch (error) {
			if (requestId !== requestIdRef.current) return;
			const message = errorMessage(
				error,
				"Unable to load the agent run.",
			);
			setState((current) =>
				current.snapshot
					? {
							...current,
							loading: false,
							liveError: `Live history is stale: ${message}`,
						}
					: {
							...current,
							loading: false,
							loadError: message,
						},
			);
		}
	}, [connected, context]);

	useEffect(() => {
		if (!connected) {
			requestIdRef.current += 1;
			setState(createEmptyState());
			return;
		}
		void refresh();
		const timer = window.setInterval(() => {
			if (!isTerminalAgentRunStatus(state.snapshot?.status ?? "")) {
				void refresh();
			}
		}, RECONCILE_INTERVAL_MS);
		return () => window.clearInterval(timer);
	}, [connected, refresh, state.snapshot?.status]);

	const decide = useCallback(
		async (
			action: PendingAgentAction,
			decision: "approve" | "edit" | "reject" | "respond",
			paramValues?: Record<string, unknown>,
		) => {
			if (!connected || action.runId !== agentRunId) {
				throw new Error(
					"The agent run is no longer connected. Refresh and try again.",
				);
			}
			if (state.snapshot?.canControl !== true) {
				throw new Error(
					"Only Automation project editors can resolve agent actions.",
				);
			}
			await resolveAutomationAgentRunAction({
				...context,
				action,
				decision,
				paramValues,
			});
			await refresh();
		},
		[agentRunId, connected, context, refresh, state.snapshot?.canControl],
	);

	const cancel = useCallback(async () => {
		if (!connected || state.snapshot?.canControl !== true) {
			throw new Error(
				"Only Automation project editors can stop agent runs.",
			);
		}
		const snapshot = await stopAutomationAgentRun(context);
		setState((current) => ({
			...current,
			snapshot,
			messages: Array.isArray(snapshot.messages)
				? snapshot.messages
				: current.messages,
			liveError: null,
		}));
		return snapshot;
	}, [connected, context, state.snapshot?.canControl]);

	return { ...state, refresh: () => void refresh(), decide, cancel };
}
