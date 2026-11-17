import { toError } from "@semoss/utility/error";
import type { InputMessageStore } from "../store/input-message.store";
import type { ResponseMessageStore } from "../store/response-message.store";
import { createResponsePlaceholder } from "../store/response-placeholder";

/** One turn of a room: the user's message, the response it answers, and the reply. */
export interface Turn {
	/** The response the user's message answers. */
	readonly parent: ResponseMessageStore;
	/** The user's message, already in the tree under `parent`. */
	readonly input: InputMessageStore;
	/** The reply's placeholder, already in the tree under `input` and thinking. */
	readonly response: ResponseMessageStore;
}

/**
 * How a room runs a turn: what it asks the backend, and how the reply arrives.
 * A chat room streams `AskPlayground` (`ChatTurnRunner`); an agent room starts
 * and watches a run (`AgentTurnRunner`). The placeholder, the tree, thinking,
 * loading, errors and the rollback are `runTurn`'s, so a runner only runs.
 */
export interface TurnRunner {
	/**
	 * Run the turn into its reply.
	 *
	 * @param turn - The turn, wired into the tree.
	 * @returns Once the reply has settled, or a stop has unwound it.
	 * @throws When the turn failed; `runTurn` then withdraws the message.
	 */
	run(turn: Turn): Promise<void>;
}

/**
 * Keep the room loading and the reply thinking while a turn's work runs, and
 * put a failure on the room.
 *
 * @param response - The reply the work fills.
 * @param work - The work.
 * @param rollback - Undoes the turn when the work fails.
 * @returns Once the work has settled.
 * @throws What the work threw.
 */
export const trackTurn = async (
	response: ResponseMessageStore,
	work: () => Promise<void>,
	rollback?: () => void,
): Promise<void> => {
	const room = response.room;
	room.setIsLoading(true);
	response.setIsThinking(true);
	try {
		await work();
	} catch (e) {
		rollback?.();
		room.setError(toError(e));
		throw e;
	} finally {
		response.setIsThinking(false);
		room.setIsLoading(false);
	}
};

/**
 * Run a turn: hang the user's message and a placeholder reply under `parent`
 * (unless the reply is already in the tree), and run it with `runner`. A turn
 * that fails takes the user's message back out and shows its error.
 *
 * @param runner - How the room runs it.
 * @param parent - The response the user's message answers.
 * @param input - The user's message.
 * @param existingResponse - A placeholder already in the tree under `input`.
 * @returns Once the reply has settled.
 * @throws What the turn threw.
 */
export const runTurn = (
	runner: TurnRunner,
	parent: ResponseMessageStore,
	input: InputMessageStore,
	existingResponse?: ResponseMessageStore,
): Promise<void> => {
	const response = existingResponse ?? createResponsePlaceholder(parent.room);
	if (!existingResponse) {
		parent.addChild(input);
		input.addChild(response);
	}
	return trackTurn(
		response,
		() => runner.run({ parent, input, response }),
		() => parent.removeChild(input),
	);
};
