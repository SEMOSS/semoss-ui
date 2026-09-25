import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";
import type { ValidatedRoomMessage } from "@/features/messages/api/message-schemas";
import type { ComposerSubmission, PendingToolApproval } from "../types/room";
import {
	type AgentTurnConfig,
	AgentTurnController,
	type AgentTurnSnapshot,
} from "./agent-turn-controller";

// Active runs survive route changes. Evict idle rooms to bound retained transcripts.
const controllers = new Map<string, AgentTurnController>();
const MAX_IDLE_ROOMS = 20;

function roomController(config: AgentTurnConfig): AgentTurnController {
	const key = `${config.insightId}:${config.roomId}`;
	let controller = controllers.get(key);
	if (!controller) {
		controller = new AgentTurnController(config);
		controllers.set(key, controller);
	}
	controller.configure(config);
	return controller;
}

/** Submit through the same controller instance that the durable room will observe. */
export async function submitAgentTurn(
	config: AgentTurnConfig,
	submission: ComposerSubmission,
): Promise<void> {
	await roomController(config).send(submission);
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
	const { insightId, roomId, agentId, engine, maxTurns, maxReflections } =
		options;
	const controller = useMemo(
		() =>
			roomController({
				insightId,
				roomId,
				agentId,
				engine,
				maxTurns,
				maxReflections,
			}),
		[insightId, roomId, agentId, engine, maxTurns, maxReflections],
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
			for (const [key, idle] of controllers) {
				if (controllers.size <= MAX_IDLE_ROOMS) break;
				if (
					idle === controller ||
					!idle.canEvict() ||
					idle.getSnapshot().isRunning
				)
					continue;
				idle.dispose();
				controllers.delete(key);
			}
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
