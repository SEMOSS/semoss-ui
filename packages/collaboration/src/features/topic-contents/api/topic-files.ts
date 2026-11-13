import { z } from "@semoss/ui/next";
import { mapTopicFiles } from "@/features/collaboration/live/live-state";
import type { TopicFile } from "@/features/collaboration/state/collaboration.types";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const linkedFilesSchema = z.object({ files: z.array(z.unknown()) });

/**
 * Links a OneDrive or Teams file to a topic, or removes the link. The server reads the file from Microsoft
 * 365 before linking it, so it refuses a folder and a file the owner can no longer open.
 *
 * @returns The topic's files after the change.
 */
export async function linkTopicFile(
	actions: InsightActions,
	topicId: string,
	file: Pick<TopicFile, "itemId" | "driveId" | "source">,
	remove = false,
): Promise<TopicFile[]> {
	const result = await callPixel(
		actions,
		pixel("BrainLinkTopicFile", {
			topicId,
			driveId: file.driveId,
			itemId: file.itemId,
			source: file.source,
			remove,
		}),
		linkedFilesSchema,
	);
	return mapTopicFiles(result.files);
}
