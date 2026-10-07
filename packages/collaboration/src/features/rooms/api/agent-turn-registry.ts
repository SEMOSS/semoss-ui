import {
	type AgentTurnConfig,
	AgentTurnController,
} from "./agent-turn-controller";

const controllers = new Map<string, AgentTurnController>();
const MAX_IDLE_ROOMS = 20;

/** Share one poll consumer between Work and legacy views of the same owned room. */
export function getAgentTurnController(
	config: AgentTurnConfig,
): AgentTurnController {
	const key = JSON.stringify([
		config.controllerScopeId ?? config.insightId,
		config.roomId,
	]);
	let controller = controllers.get(key);
	if (!controller) {
		controller = new AgentTurnController(config);
		controllers.set(key, controller);
	}
	controller.configure(config);
	return controller;
}

/** Active runs survive navigation; detached terminal rooms have a bounded cache. */
export function evictIdleAgentTurnControllers(
	current: AgentTurnController,
): void {
	for (const [key, controller] of controllers) {
		if (controllers.size <= MAX_IDLE_ROOMS) break;
		if (
			controller === current ||
			!controller.canEvict() ||
			controller.getSnapshot().isRunning
		)
			continue;
		controller.dispose();
		controllers.delete(key);
	}
}
