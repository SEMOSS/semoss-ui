import { Session } from "./session.store";

/**
 * Run a pixel in the session's own insight (`Session.insight`), throwing
 * when any statement fails. For room-less work — models, agents, knowledge,
 * the rooms list; a room's pixels run in the room's insight instead.
 *
 * @param pixel - The pixel to run.
 * @returns The insight id and each statement's return.
 * @throws When any statement returns an error.
 */
export const runSessionPixel = async <O extends unknown[] | []>(
	pixel: string,
) => {
	const response = await Session.insight.run<O>(pixel);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}
	return response;
};
