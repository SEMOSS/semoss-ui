import { download, uploadInsight } from "@semoss/sdk";
import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

export const topicFileSchema = z.object({
	fileId: z.string(),
	topicId: z.string(),
	name: z.string(),
	size: z.number().nonnegative(),
	mime: z.string(),
	uploadedAt: z.string(),
});
export type TopicFile = z.infer<typeof topicFileSchema>;
export const topicFilesPageSchema = z.object({
	files: z.array(topicFileSchema),
	total: z.number().int().nonnegative(),
	maxBytes: z.number().positive(),
	limit: z.number(),
	offset: z.number(),
});
const copiedFileSchema = z.object({
	fileName: z.string(),
	fileLocation: z.string(),
});

/** Persist an existing insight or owned-room file as an original topic attachment. */
export function saveTopicFile(
	actions: InsightActions,
	topicId: string,
	filePath: string,
	roomId?: string,
): Promise<TopicFile> {
	return callPixel(
		actions,
		pixel("BrainUploadTopicFile", {
			topicId,
			filePath: filePath.replace(/^\/+/, ""),
			roomId,
		}),
		topicFileSchema,
	);
}
/** Upload one file and persist it before reporting success. */
export async function uploadTopicFile(
	actions: InsightActions,
	insightId: string,
	topicId: string,
	file: File,
): Promise<TopicFile> {
	const response = await uploadInsight(insightId, "", [file]);
	const uploaded = z.array(copiedFileSchema).length(1).parse(response.data);
	return saveTopicFile(actions, topicId, uploaded[0].fileLocation);
}
/** Delete the original and its metadata. */
export async function deleteTopicFile(
	actions: InsightActions,
	file: TopicFile,
): Promise<void> {
	await callPixel(
		actions,
		pixel("BrainDeleteTopicFile", {
			topicId: file.topicId,
			fileId: file.fileId,
		}),
		z.object({ deleted: z.literal(true) }),
	);
}
/** Export the original through the standard SEMOSS download flow. */
export async function downloadTopicFile(
	actions: InsightActions,
	insightId: string,
	file: TopicFile,
): Promise<void> {
	const key = await callPixel(
		actions,
		pixel("BrainDownloadTopicFile", {
			topicId: file.topicId,
			fileId: file.fileId,
		}),
		z.string(),
	);
	await download(insightId, key);
}
/** Copy into a linked room and return an attachment accepted by the existing composer. */
export function copyTopicFile(
	actions: InsightActions,
	roomId: string,
	file: TopicFile,
): Promise<z.infer<typeof copiedFileSchema>> {
	return callPixel(
		actions,
		pixel("BrainCopyTopicFileToRoom", {
			topicId: file.topicId,
			fileId: file.fileId,
			roomId,
		}),
		copiedFileSchema,
	);
}
