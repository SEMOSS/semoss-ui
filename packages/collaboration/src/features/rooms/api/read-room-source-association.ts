import type { InsightActions } from "@/lib/pixel";
import { readRoomTopicAssociations } from "./room-topics";

/** Direct topic membership never depends on a source thread. */
export async function readRoomSourceAssociation(
	actions: InsightActions,
	roomId: string,
	refresh = false,
): Promise<{ threadId: string | null; topicIds: string[] }> {
	const result = await readRoomTopicAssociations(actions, roomId, refresh);
	return {
		threadId: result.threadId ?? null,
		topicIds: result.topics
			.filter((topic) => topic.state === "linked")
			.map((topic) => topic.topicId),
	};
}
