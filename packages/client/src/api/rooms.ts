import { createRoom, runPixel, setRoomForInsight } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";

/** One login-provider entry in the GetUserInfo response. */
interface UserInfoProvider {
	/** Profile metadata map (e.g. "text-generation-model"). */
	meta?: Record<string, unknown>;
}

/**
 * Throw when a pixel response contains an operation error. No-op when the
 * error list is empty.
 *
 * @name assertPixelSuccess
 * @param errors - Operation errors collected from a runPixel response.
 */
const assertPixelSuccess = (errors: string[]): void => {
	if (errors.length > 0) {
		throw new Error(errors.join(""));
	}
};

/**
 * Extract a profile metadata string that may be returned as an array.
 *
 * @name getProfileMetadataValue
 * @param value - Raw metadata value: a string, an array of strings, or
 * anything else.
 * @return The string value (first array element when wrapped), or an empty
 * string when the value is not a string.
 */
export const getProfileMetadataValue = (value: unknown): string => {
	if (typeof value === "string") {
		return value;
	}

	if (Array.isArray(value) && typeof value[0] === "string") {
		return value[0];
	}

	return "";
};

/**
 * Resolve a text-generation model engine by its id.
 *
 * @name resolveWorkbenchChatModel
 * @param insightId - Insight the pixel executes against.
 * @param modelId - Engine id of the model to resolve.
 * @return The matching engine, or null when the id is empty or no
 * text-generation model with that id is visible to the user.
 */
export const resolveWorkbenchChatModel = async (
	insightId: string,
	modelId: string,
): Promise<Engine | null> => {
	if (!modelId) {
		return null;
	}

	const modelResponse = await runPixel<[Engine[]]>(
		`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"], filterWord=${JSON.stringify(modelId)});`,
		insightId,
	);
	assertPixelSuccess(modelResponse.errors);

	return (
		modelResponse.pixelReturn[0]?.output.find(
			(engine) => engine.engine_id === modelId,
		) ?? null
	);
};

/**
 * Resolve the user's configured default text-generation model by reading the
 * "text-generation-model" entry from their profile metadata.
 *
 * @name getDefaultWorkbenchChatModel
 * @param insightId - Insight the pixels execute against.
 * @return The user's default engine, or null when none is configured or it
 * cannot be resolved.
 */
export const getDefaultWorkbenchChatModel = async (
	insightId: string,
): Promise<Engine | null> => {
	const userResponse = await runPixel<[Record<string, UserInfoProvider>]>(
		"META | GetUserInfo();",
		insightId,
	);
	assertPixelSuccess(userResponse.errors);

	const provider = Object.values(
		userResponse.pixelReturn[0]?.output ?? {},
	)[0];
	const modelId = getProfileMetadataValue(
		provider?.meta?.["text-generation-model"],
	);

	return resolveWorkbenchChatModel(insightId, modelId);
};

/**
 * Create and bind a mount-scoped room to the workbench insight.
 *
 * @name createWorkbenchRoom
 * @param insightId - Insight the room is created for and bound to.
 * @return The id of the newly created room.
 */
export const createWorkbenchRoom = async (
	insightId: string,
): Promise<string> => {
	const roomId = await createRoom(insightId);
	await setRoomForInsight(insightId, roomId);
	return roomId;
};
