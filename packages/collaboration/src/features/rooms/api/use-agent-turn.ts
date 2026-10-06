import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";
import type { ValidatedRoomMessage } from "@/features/messages/api/message-schemas";
import type { ComposerSubmission, PendingToolApproval } from "../types/room";
import type {
	AgentTurnConfig,
	AgentTurnSnapshot,
} from "./agent-turn-controller";
import {
	evictIdleAgentTurnControllers,
	getAgentTurnController,
} from "./agent-turn-registry";

/** Submit through the same controller instance that the durable room will observe. */
export async function submitAgentTurn(
	config: AgentTurnConfig,
	submission: ComposerSubmission,
): Promise<void> {
	await getAgentTurnController(config).send(submission, config);
}

interface UseAgentTurnOptions extends AgentTurnConfig {
	onSettled?: (roomId: string) => void;
}

interface AgentTurn extends AgentTurnSnapshot {
	send: (submission: ComposerSubmission) => Promise<void>;
	cancel: () => Promise<void>;
	approve: (
		approval: PendingToolApproval,
		parameters: Record<string, unknown>,
	) => Promise<void>;
	reject: (approval: PendingToolApproval) => Promise<void>;
	reconnect: () => Promise<void>;
	reconcileHistory: (messages: ValidatedRoomMessage[]) => void;
}

/** Attach the room UI to its single durable agent-run observer. */
export function useAgentTurn(options: UseAgentTurnOptions): AgentTurn {
	const {
		insightId,
		controllerScopeId,
		roomId,
		agentId,
		engine,
		maxTurns,
		maxReflections,
	} = options;
	const controller = useMemo(
		() =>
			getAgentTurnController({
				insightId,
				controllerScopeId,
				roomId,
				agentId,
				engine,
				maxTurns,
				maxReflections,
			}),
		[
			insightId,
			controllerScopeId,
			roomId,
			agentId,
			engine,
			maxTurns,
			maxReflections,
		],
	);
	controller.configure(options);
	const snapshot = useSyncExternalStore(
		controller.subscribe,
		controller.getSnapshot,
		controller.getSnapshot,
	);
	const onSettled = useRef(options.onSettled);
	onSettled.current = options.onSettled;
	const observed = useRef({
		controller,
		version: snapshot.settlementVersion,
	});

	useEffect(() => {
		if (roomId) void controller.reconnect();
		return () => {
			evictIdleAgentTurnControllers(controller);
		};
	}, [controller, roomId]);

	useEffect(() => {
		if (observed.current.controller !== controller) {
			observed.current = {
				controller,
				version: snapshot.settlementVersion,
			};
			return;
		}
		if (observed.current.version === snapshot.settlementVersion) return;
		observed.current.version = snapshot.settlementVersion;
		onSettled.current?.(roomId);
	}, [controller, roomId, snapshot.settlementVersion]);

	return {
		...snapshot,
		send: controller.send,
		cancel: controller.cancel,
		approve: controller.approve,
		reject: controller.reject,
		reconnect: controller.reconnect,
		reconcileHistory: useCallback(
			(messages) => controller.reconcileHistory(messages),
			[controller],
		),
	};
}
