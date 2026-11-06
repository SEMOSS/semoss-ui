import { runPixel } from "../../api/base";
import { chatPixels } from "../../api/chat-pixels";

/**
 * The one owner of "1 room = 1 insight". Every time a room loads it binds a
 * fresh insight (`SetRoomForInsight`, sent with the room's reads so they run
 * in that insight); closing the room forgets it for the user and drops its
 * insight. A room is never rebound to another room's insight.
 */

/**
 * The pixel that reads a room and binds the insight it runs in to it: its
 * messages, its options, then the binding.
 *
 * @param roomId - The room.
 * @returns One batched pixel.
 */
export const buildLoadRoomPixel = (roomId: string): string =>
	[
		chatPixels.getMessages(roomId),
		chatPixels.getRoomOptions(roomId),
		chatPixels.setRoomForInsight(roomId),
	].join(" ");

/**
 * Forget a room for the user and drop the insight it was bound to.
 *
 * @param roomId - The room.
 * @param insightId - The insight it was bound to, when it was opened.
 * @param runInSession - Runs a room-less pixel, such as in the session's
 * insight, throwing on errors.
 */
export const closeRoomSession = async (
	roomId: string,
	insightId: string | null,
	runInSession: (pixel: string) => Promise<unknown>,
): Promise<void> => {
	await runInSession(chatPixels.removeRoom(roomId));

	// only a room that was opened has an insight of its own to drop
	if (insightId && insightId !== "new") {
		try {
			await runPixel(chatPixels.dropInsight(), insightId);
		} catch (e) {
			console.warn(e);
		}
	}
};
