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
export const topicLinkSchema = z.object({
	linkId: z.string(),
	topicId: z.string(),
	source: z.string(),
	name: z.string(),
	location: z.string().nullish(),
	webUrl: z.string().nullish(),
	size: z.number().nullish(),
	modifiedAt: z.string().nullish(),
	status: z.enum(["ok", "missing", "no_access"]),
	linkedAt: z.string().nullish(),
	driveId: z.string(),
	itemId: z.string(),
	parentId: z.string().nullish(),
});
export type TopicLink = z.infer<typeof topicLinkSchema>;
export const topicFilesPageSchema = z.object({
	files: z.array(topicFileSchema),
	total: z.number().int().nonnegative(),
	maxBytes: z.number().positive(),
	limit: z.number(),
	offset: z.number(),
	links: z.array(topicLinkSchema).default([]),
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
/** Bring a linked Microsoft 365 file into the room; it downloads only when it changed. */
export function copyTopicLink(
	actions: InsightActions,
	roomId: string,
	link: TopicLink,
): Promise<z.infer<typeof copiedFileSchema>> {
	return callPixel(
		actions,
		pixel("BrainCopyTopicFileToRoom", {
			topicId: link.topicId,
			linkId: link.linkId,
			roomId,
		}),
		copiedFileSchema,
	);
}
/** Link a file by its sharing link, or by the drive and item ids a browse returned. */
export function linkTopicFile(
	actions: InsightActions,
	topicId: string,
	address: { shareUrl: string } | { driveId: string; itemId: string },
): Promise<TopicLink & { alreadyLinked?: boolean }> {
	return callPixel(
		actions,
		pixel("BrainLinkTopicFile", { topicId, ...address }),
		topicLinkSchema.extend({ alreadyLinked: z.boolean().optional() }),
	);
}
/** Remove the link only; the Microsoft 365 file is untouched. */
export async function unlinkTopicFile(
	actions: InsightActions,
	link: TopicLink,
): Promise<void> {
	await callPixel(
		actions,
		pixel("BrainUnlinkTopicFile", {
			topicId: link.topicId,
			linkId: link.linkId,
		}),
		z.object({ unlinked: z.literal(true) }),
	);
}
const refreshSchema = z.object({
	refreshed: z.boolean(),
	error: z.string().optional(),
	links: z.array(topicLinkSchema),
});
/** Re-read linked files' metadata from Microsoft 365, for one topic or a chat's topics. */
export function refreshTopicLinks(
	actions: InsightActions,
	scope: { topicId?: string; roomId?: string },
): Promise<z.infer<typeof refreshSchema>> {
	return callPixel(
		actions,
		pixel("BrainRefreshTopicLinks", scope),
		refreshSchema,
	);
}
export const driveEntrySchema = z.object({
	kind: z.enum(["file", "folder", "team", "channel", "site", "library"]),
	id: z.string().nullish(),
	name: z.string().nullish(),
	driveId: z.string().nullish(),
	itemId: z.string().nullish(),
	location: z.string().nullish(),
	size: z.number().nullish(),
	modifiedAt: z.string().nullish(),
	webUrl: z.string().nullish(),
});
export type DriveEntry = z.infer<typeof driveEntrySchema>;
export interface DriveBrowseArgs {
	view?: "mine" | "shared" | "teams" | "sites";
	driveId?: string;
	itemId?: string;
	teamId?: string;
	channelId?: string;
	siteId?: string;
	search?: string;
}
/** One place in OneDrive, SharePoint or Teams the picker can show. */
export function browseTopicDrive(
	actions: InsightActions,
	args: DriveBrowseArgs,
): Promise<DriveEntry[]> {
	return callPixel(
		actions,
		pixel("BrainBrowseTopicDrive", { ...args }),
		z.object({ entries: z.array(driveEntrySchema) }),
	).then((result) => result.entries);
}
