import { runPixel } from "./base";

// -------------------------------------------------------------------------------------------------
// The playground's chat rooms (CreatePlaygroundRoom and its kin), as the SEMOSS chat apps manage
// them. Each runs in the insight it is given, normally the session's
// (`Session.insight.withInsight`).
// -------------------------------------------------------------------------------------------------

/**
 * Throw when a pixel run reported errors. `runPixel` and `Session.insight.run` return a pixel's
 * errors rather than throwing; this keeps a caller that expects a throw working.
 *
 * @param result - What the run returned.
 * @returns The same result, when it has no errors.
 * @throws An error naming every pixel error.
 */
export const throwOnPixelErrors = <R extends { errors: string[] }>(
	result: R,
): R => {
	if (result.errors.length > 0) {
		throw new Error(result.errors.join(""));
	}
	return result;
};

/**
 * Delete one of the user's rooms.
 *
 * @param insightId - The insight to run in.
 * @param roomId - The room.
 */
export const removeUserRoom = async (
	insightId: string,
	roomId: string,
): Promise<void> => {
	throwOnPixelErrors(
		await runPixel<[boolean]>(
			`RemoveUserRoom(roomId=["${roomId}"]);`,
			insightId,
		),
	);
};

/**
 * Rename one of the user's rooms.
 *
 * @param insightId - The insight to run in.
 * @param roomId - The room.
 * @param name - The new name, already trimmed.
 */
export const renameUserRoom = async (
	insightId: string,
	roomId: string,
	name: string,
): Promise<void> => {
	throwOnPixelErrors(
		await runPixel<[boolean]>(
			`META | RenameRoom(roomId=["${roomId}"], name=["<encode>${name}</encode>"]);`,
			insightId,
		),
	);
};

/**
 * Pin a room (the room list's favorites) or unpin it.
 *
 * @param insightId - The insight to run in.
 * @param roomId - The room.
 * @param pinned - Whether it is pinned.
 */
export const pinUserRoom = async (
	insightId: string,
	roomId: string,
	pinned: boolean,
): Promise<void> => {
	throwOnPixelErrors(
		await runPixel<[boolean]>(
			`PinRoom(roomId=["${roomId}"], pinned=[${pinned}]);`,
			insightId,
		),
	);
};

/**
 * How many tokens a model takes in one request.
 *
 * @param insightId - The insight to run in.
 * @param engineId - The model's engine.
 * @returns Its context window, or undefined when the backend does not know it.
 */
export const getModelContextWindow = async (
	insightId: string,
	engineId: string,
): Promise<number | undefined> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[number | undefined]>(
			`META | GetContextWindow(${JSON.stringify(engineId)});`,
			insightId,
		),
	);
	return pixelReturn[0]?.output;
};
